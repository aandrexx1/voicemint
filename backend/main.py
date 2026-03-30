from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import html
import openai
import os
import tempfile
from auth import hash_password, verify_password, create_token, get_current_user
from pydantic import BaseModel
from sqlalchemy.orm import Session
from processors.nlp_parser import parse_transcription
from processors.document_gen import generate_ppt
from fastapi.responses import FileResponse, JSONResponse
from models import create_tables, migrate_oauth_columns, get_db, User, Conversion, Waitlist, SessionLocal
import resend
import stripe
from groq import Groq
from jose import jwt, JWTError
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
from datetime import datetime, timedelta

from auth import SECRET_KEY, ALGORITHM
from starlette.middleware.sessions import SessionMiddleware
from oauth_routes import router as oauth_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import json
import re
import secrets
from urllib.parse import urlparse

resend.api_key = os.getenv("RESEND_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="VoiceMint API")

# Origini CORS (usate anche da CSRF e fallback: le risposte 403/429 a volte non passano dal CORSMiddleware)
CORS_ALLOW_ORIGINS = frozenset(
    {
        "http://localhost:5173",
        "https://voicemint.vercel.app",
        "https://voicemint.it",
        "https://www.voicemint.it",
    }
)
# Qualsiasi sottodominio *.voicemint.it (preview Vercel, app, ecc.)
CORS_ORIGIN_REGEX = r"^https://([a-z0-9-]+\.)*voicemint\.it$"


def _cors_allowed_origin(origin: str) -> str | None:
    o = (origin or "").strip().rstrip("/")
    if o in CORS_ALLOW_ORIGINS:
        return o
    if re.fullmatch(CORS_ORIGIN_REGEX, o):
        return o
    return None


def _effective_cors_origin(request: Request) -> str | None:
    """Origin dalla richiesta; se manca (browser/extension), prova a dedurlo dal Referer."""
    raw = (request.headers.get("origin") or "").strip().rstrip("/")
    if raw:
        return _cors_allowed_origin(raw)
    ref = (request.headers.get("referer") or "").strip()
    if not ref:
        return None
    try:
        u = urlparse(ref)
        if u.scheme and u.netloc:
            return _cors_allowed_origin(f"{u.scheme}://{u.netloc}")
    except Exception:
        pass
    return None


def _apply_cors_headers(request: Request, response: Response) -> Response:
    origin = _effective_cors_origin(request)
    if origin and not response.headers.get("access-control-allow-origin"):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers.setdefault("Access-Control-Expose-Headers", "Content-Disposition")
    return response


def _origin_from_scope(scope: dict) -> str | None:
    """Legge Origin/Referer dagli header ASGI (bytes) per il middleware puro ASGI."""
    origin = None
    for k, v in scope.get("headers") or []:
        if k.lower() == b"origin":
            try:
                origin = v.decode("latin-1").strip()
            except Exception:
                pass
            break
    if origin:
        return _cors_allowed_origin(origin)
    referer = None
    for k, v in scope.get("headers") or []:
        if k.lower() == b"referer":
            try:
                referer = v.decode("latin-1").strip()
            except Exception:
                pass
            break
    if referer:
        u = urlparse(referer)
        if u.scheme and u.netloc:
            return _cors_allowed_origin(f"{u.scheme}://{u.netloc}")
    return None


class OutermostCORSInjection:
    """
    ASGI puro: aggiunge ACAO sulla risposta se manca, senza bufferizzare il body
    (a differenza di BaseHTTPMiddleware). Copre casi in cui il proxy o errori
    intermedi lasciano la risposta senza header CORS.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        origin_ok = _origin_from_scope(scope)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                hdrs = list(message.get("headers") or [])
                has_acao = any(k.lower() == b"access-control-allow-origin" for k, _ in hdrs)
                if not has_acao and origin_ok:
                    hdrs.append((b"access-control-allow-origin", origin_ok.encode("utf-8")))
                    hdrs.append((b"access-control-allow-credentials", b"true"))
                    hdrs.append((b"access-control-expose-headers", b"Content-Disposition"))
                    message = {**message, "headers": hdrs}
            await send(message)

        await self.app(scope, receive, send_wrapper)


def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> Response:
    resp = _rate_limit_exceeded_handler(request, exc)
    return _apply_cors_headers(request, resp)


limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

@app.on_event("startup")
def startup():
    create_tables()
    migrate_oauth_columns()

SESSION_SECRET = os.getenv("SESSION_SECRET", SECRET_KEY)
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

# CORS: un solo CORSMiddleware in coda al file (dopo tutti i @middleware), così è lo strato
# più esterno e non serve duplicare qui (evita doppi header).

app.include_router(oauth_router, prefix="/auth", tags=["oauth"])

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), geolocation=(), microphone=()")
    return response

def _set_auth_cookie(response: Response, token: str):
    secure = os.getenv("COOKIE_SECURE", "1") != "0"
    # Per cookie cross-site (frontend su voicemint.it e backend su onrender.com) serve SameSite=None
    samesite = os.getenv("COOKIE_SAMESITE", "none").lower()
    if samesite not in ("lax", "strict", "none"):
        samesite = "lax"
    response.set_cookie(
        key="vm_token",
        value=token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    # CSRF token (non-HttpOnly) per richieste mutating con cookie auth
    csrf = secrets.token_urlsafe(24)
    response.set_cookie(
        key="vm_csrf",
        value=csrf,
        httponly=False,
        secure=secure,
        samesite=samesite,
        max_age=60 * 60 * 24 * 7,
        path="/",
    )

def _clear_auth_cookie(response: Response):
    # Must match the same cookie attributes used in `_set_auth_cookie`, otherwise
    # browsers can keep the cookie after deletion (e.g. SameSite/secure mismatch).
    secure = os.getenv("COOKIE_SECURE", "1") != "0"
    samesite = os.getenv("COOKIE_SAMESITE", "none").lower()
    if samesite not in ("lax", "strict", "none"):
        samesite = "lax"

    # Starlette: delete_cookie must use the same path/secure/samesite as set_cookie.
    response.delete_cookie(
        "vm_token",
        path="/",
        secure=secure,
        httponly=True,
        samesite=samesite,
    )
    response.delete_cookie(
        "vm_csrf",
        path="/",
        secure=secure,
        httponly=False,
        samesite=samesite,
    )

@app.middleware("http")
async def csrf_protect(request: Request, call_next):
    # Logout should always work even if the origin does not match the CSRF allowlist.
    # (If you want strict CSRF for logout too, remove this bypass.)
    if request.url.path == "/logout":
        return await call_next(request)

    # Protegge solo quando si usa cookie auth (nessun Bearer).
    # In setup cross-domain (frontend su voicemint.it, backend su onrender.com)
    # JS non può leggere cookie backend per inviare X-CSRF-Token: usiamo allowlist Origin/Referer.
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        has_cookie = bool(request.cookies.get("vm_token"))
        has_bearer = bool(request.headers.get("authorization"))
        if has_cookie and not has_bearer:
            allowed = {
                "https://voicemint.it",
                "https://www.voicemint.it",
                "https://voicemint.vercel.app",
                "http://localhost:5173",
            }
            origin = (request.headers.get("origin") or "").rstrip("/")
            referer = request.headers.get("referer") or ""
            referer_ok = any(referer.startswith(a + "/") or referer == a for a in allowed)
            if origin and origin not in allowed:
                return _apply_cors_headers(
                    request,
                    JSONResponse({"detail": "CSRF origin blocked"}, status_code=403),
                )
            if not origin and not referer_ok:
                return _apply_cors_headers(
                    request,
                    JSONResponse({"detail": "CSRF referer blocked"}, status_code=403),
                )
    return await call_next(request)

@app.get("/")
def root():
    return {"message": "VoiceMint API is running!"}

@app.post("/upload-audio")
@limiter.limit("10/minute")
async def upload_audio(request: Request, file: UploadFile = File(...)):
    # Controlla che sia un file audio
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Il file deve essere audio")
    
    # Salva il file temporaneamente
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        content = await file.read()
        max_bytes = int(os.getenv("MAX_AUDIO_BYTES", str(10 * 1024 * 1024)))  # default 10MB
        if len(content) > max_bytes:
            raise HTTPException(status_code=413, detail="File audio troppo grande")
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Manda l'audio a Whisper
        with open(tmp_path, "rb") as audio_file:
            transcript = groq_client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                language="it"
            )
        return {"transcription": transcript.text}
    
    finally:
        os.unlink(tmp_path)  # Elimina il file temporaneo

# --- Schema dati ---
class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GenerateRequest(BaseModel):
    transcription: str
    output_type: str = "ppt"
    # "study" = appunti/schemi; "presentation" = esposizione orale (template con placeholder foto se presenti)
    deck_mode: str = "presentation"

# --- Registrazione ---
@app.post("/register")
@limiter.limit("5/minute")
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    # Conta utenti registrati finora
    user_count = db.query(User).count()
    registration_rank = user_count + 1
    
    # Assegna tier in base al numero
    if registration_rank <= 50:
        tier = "pro"
        lifetime_pro = True
        pro_until = None
    elif registration_rank <= 100:
        tier = "pro"
        lifetime_pro = False
        pro_until = datetime.utcnow() + timedelta(days=30)
    else:
        tier = "free"
        lifetime_pro = False
        pro_until = None

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        tier=tier,
        lifetime_pro=lifetime_pro,
        pro_until=pro_until,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token({"sub": user.email})
    payload = {
        "token": token,
        "username": user.username,
        "tier": user.tier,
        "lifetime_pro": user.lifetime_pro,
    }
    response = JSONResponse(payload)
    _set_auth_cookie(response, token)
    return response

# --- Login ---
@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user or not user.hashed_password or not verify_password(
        data.password, user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    token = create_token({"sub": user.email})
    payload = {"token": token, "username": user.username, "tier": user.tier}
    response = JSONResponse(payload)
    _set_auth_cookie(response, token)
    return response

@app.post("/logout")
def logout():
    response = Response(content='{"ok":true}', media_type="application/json")
    _clear_auth_cookie(response)
    return response


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def create_reset_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=30)
    payload = {"sub": email, "type": "reset", "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@app.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    # Messaggio generico per non rivelare se l'email esiste
    message = {"message": "Email inviata"}
    if not user:
        return message

    token = create_reset_token(user.email)
    reset_link = f"https://voicemint.it/reset-password?token={token}"

    try:
        resend.Emails.send(
            {
                "from": "VoiceMint <noreply@voicemint.it>",
                "to": data.email,
                "subject": "Hai richiesto di cambiare la password — VoiceMint",
                "html": f"""
                <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 36px; background: #0a0a0a; color: #ffffff;">
                  <div style="display:flex; align-items:center; gap:10px; margin-bottom: 18px;">
                    <img src="https://voicemint.it/logo.png" alt="VoiceMint" style="height: 30px; width: auto;" />
                  </div>
                  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Hai richiesto di cambiare la password</h1>
                  <p style="color:#b3b3b3; line-height:1.6; margin: 0 0 18px;">
                    Se non sei stato tu, puoi ignorare questo messaggio. Se invece l'hai richiesto, usa il link qui sotto per impostare una nuova password.
                  </p>
                  <a href="{reset_link}" style="display:inline-block; background:#ffffff; color:#000000; padding: 12px 18px; border-radius: 999px; text-decoration:none; font-weight: 700;">
                    Cambia password
                  </a>
                  <p style="color:#7a7a7a; font-size: 12px; line-height:1.6; margin: 22px 0 0;">
                    Link valido per 30 minuti.
                  </p>
                </div>
                """,
            }
        )
    except Exception as e:
        print(f"Errore invio reset password: {e}")

    return message


@app.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, data: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=400, detail="Token non valido")

    if payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Token non valido")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=400, detail="Token non valido")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token non valido")

    user.hashed_password = hash_password(data.new_password)
    db.add(user)
    db.commit()

    return {"message": "Password aggiornata"}

# --- Profilo utente (richiede login) ---
@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    # Controlla se il pro_until è scaduto
    if current_user.pro_until and current_user.pro_until < datetime.utcnow():
        db = SessionLocal()
        user = db.query(User).filter(User.email == current_user.email).first()
        user.tier = "free"
        db.commit()
        db.close()
        current_user.tier = "free"

    return {
        "email": current_user.email,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "tier": current_user.tier,
        "lifetime_pro": current_user.lifetime_pro,
        "pro_until": current_user.pro_until,
        "monthly_usage": current_user.monthly_usage,
    }

# --- Genera documento da testo ---
@app.post("/generate")
@limiter.limit("20/minute")
def generate(
    request: Request,
    data: GenerateRequest | None = None,
    transcription: str | None = None,
    output_type: str = "ppt",  # legacy query param
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text = ""
    out = output_type
    deck_mode = "presentation"
    if data is not None:
        text = (data.transcription or "").strip()
        out = (data.output_type or output_type or "ppt")
        dm = (getattr(data, "deck_mode", None) or "presentation").strip().lower()
        deck_mode = "study" if dm == "study" else "presentation"
    else:
        text = (transcription or "").strip()

    if len(text) > int(os.getenv("MAX_TRANSCRIPTION_CHARS", "20000")):
        raise HTTPException(status_code=413, detail="Testo troppo lungo")
    # Controlla limite utenti free
    if current_user.tier == "free" and current_user.monthly_usage >= 180:
        raise HTTPException(status_code=403, detail="Limite mensile raggiunto. Passa a Pro!")
    
    parsed = parse_transcription(text, deck_mode=deck_mode)

    # Genera il file richiesto
    if out == "ppt":
        file_path = generate_ppt(parsed, user_tier=current_user.tier)
    else:
        raise HTTPException(status_code=400, detail="Tipo non valido. Usa solo: ppt (PowerPoint)")
    
    # Salva la conversione nel database
    conversion = Conversion(
        user_id=current_user.id,
        transcription=text,
        title=parsed["title"],
        output_type=out,
        file_path=file_path,
    )
    db.add(conversion)
    current_user.monthly_usage += int(len(text.split()) / 3)
    db.commit()
    
    return FileResponse(
        file_path,
        # generate_ppt() salva come .pptx: qui usiamo l'estensione corretta
        filename=f"voicemint_{str(parsed.get('title') or 'presentazione')[:20]}.pptx",
        media_type="application/octet-stream"
    )

class CreateCheckoutSessionRequest(BaseModel):
    """Stripe Checkout: starter = Starter plan (watermark), professional = Professional (no watermark)."""
    plan: str = "professional"  # "starter" | "professional"
    interval: str = "month"  # "month" | "year"


def _stripe_price_id_for_plan(plan: str, interval: str) -> str:
    plan = plan.lower().strip()
    interval = interval.lower().strip()
    if interval not in ("month", "year"):
        raise HTTPException(status_code=400, detail="interval must be month or year")
    env_map = {
        ("starter", "month"): "STRIPE_PRICE_STARTER_MONTHLY",
        ("starter", "year"): "STRIPE_PRICE_STARTER_YEARLY",
        ("professional", "month"): "STRIPE_PRICE_PROFESSIONAL_MONTHLY",
        ("professional", "year"): "STRIPE_PRICE_PROFESSIONAL_YEARLY",
    }
    key = (plan, interval)
    if key not in env_map:
        raise HTTPException(status_code=400, detail="Invalid plan")
    price_id = os.getenv(env_map[key])
    if price_id:
        return price_id
    # Backward compatibility: single Pro monthly price
    if plan == "professional" and interval == "month":
        legacy = os.getenv("STRIPE_PRICE_ID")
        if legacy:
            return legacy
    raise HTTPException(
        status_code=503,
        detail="Stripe price not configured. Set the matching STRIPE_PRICE_* environment variable.",
    )


def _tier_for_checkout_plan(plan: str) -> str:
    if plan.lower().strip() == "starter":
        return "starter"
    return "pro"


class ContactSalesRequest(BaseModel):
    work_email: str
    topic: str


CONTACT_SALES_TOPICS = frozenset({"enterprise", "support", "partnership"})


@app.post("/contact-sales")
@limiter.limit("5/minute")
def contact_sales(request: Request, data: ContactSalesRequest):
    """Public form: notifies sales inbox via Resend."""
    email = (data.work_email or "").strip()
    topic = (data.topic or "").strip().lower()
    if "@" not in email or len(email) > 254:
        raise HTTPException(status_code=400, detail="Email non valida")
    if topic not in CONTACT_SALES_TOPICS:
        raise HTTPException(status_code=400, detail="Argomento non valido")

    inbox = os.getenv("CONTACT_SALES_INBOX", "support@voicemint.it")
    topic_labels = {
        "enterprise": "Voicemint Enterprise",
        "support": "Support",
        "partnership": "Partnership",
    }
    label = topic_labels.get(topic, topic)
    safe_email = html.escape(email)
    safe_label = html.escape(label)

    body_html = f"""
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #0a0a0a; color: #ffffff;">
      <h1 style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">Richiesta da voicemint.it/contact-sales</h1>
      <p style="color: #b3b3b3; margin: 0 0 8px;"><strong style="color: #fff;">Email di lavoro:</strong> {safe_email}</p>
      <p style="color: #b3b3b3; margin: 0;"><strong style="color: #fff;">Argomento:</strong> {safe_label}</p>
    </div>
    """

    try:
        resend.Emails.send(
            {
                "from": "VoiceMint <noreply@voicemint.it>",
                "to": inbox,
                "subject": f"[Contact sales] {label} — {email}",
                "html": body_html,
            }
        )
    except Exception as e:
        print(f"contact-sales email error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Invio non riuscito. Riprova più tardi.",
        )

    return {"message": "ok"}


class WaitlistRequest(BaseModel):
    email: str

@app.post("/waitlist")
@limiter.limit("5/minute")
def join_waitlist(request: Request, data: WaitlistRequest, db: Session = Depends(get_db)):
    existing = db.query(Waitlist).filter(Waitlist.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata alla waitlist")
    
    entry = Waitlist(email=data.email)
    db.add(entry)
    db.commit()

    # Manda email di conferma
    try:
        resend.Emails.send({
            "from": "VoiceMint <noreply@voicemint.it>",
            "to": data.email,
            "subject": "Sei nella lista — VoiceMint",
            "html": """
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; background: #0a0a0a; color: #ffffff;">
                    <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Grazie per esserti iscritto.</h1>
                    <p style="color: #888; line-height: 1.6; margin-bottom: 24px;">
                        Sei nella waitlist di VoiceMint. Ti avviseremo non appena il prodotto sarà disponibile.
                    </p>
                    <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
                    <p style="color: #444; font-size: 12px;">VoiceMint — Dalla voce al documento in 30 secondi.</p>
                </div>
            """
        })
    except Exception as e:
        print(f"Errore invio email: {e}")

    return {"message": "Iscrizione avvenuta con successo!"}

@app.post("/create-checkout-session")
def create_checkout_session(
    data: CreateCheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
):
    price_id = _stripe_price_id_for_plan(data.plan, data.interval)
    tier = _tier_for_checkout_plan(data.plan)
    frontend = os.getenv("FRONTEND_URL", "https://voicemint.it").rstrip("/")
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{frontend}/profile?checkout=success",
        cancel_url=f"{frontend}/",
        customer_email=current_user.email,
        metadata={"tier": tier, "user_email": current_user.email},
        subscription_data={"metadata": {"tier": tier}},
    )
    return {"url": session.url}

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Webhook error")
    
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        email = session.get("customer_email") or (session.get("customer_details") or {}).get("email")
        metadata = session.get("metadata") or {}
        tier = (metadata.get("tier") or "pro").lower().strip()
        if tier not in ("starter", "pro", "enterprise"):
            tier = "pro"
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first() if email else None
        if user:
            user.tier = tier
            db.commit()
        db.close()

    if event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        customer_id = sub.get("customer")
        db = SessionLocal()
        try:
            if customer_id:
                cust = stripe.Customer.retrieve(customer_id)
                email = cust.get("email")
                if email:
                    user = db.query(User).filter(User.email == email).first()
                    if user and user.tier in ("starter", "pro") and not user.lifetime_pro:
                        user.tier = "free"
                        user.pro_until = None
                        db.add(user)
                        db.commit()
        except Exception as e:
            print(f"Stripe subscription.deleted handler: {e}")
        db.close()
    
    return {"status": "ok"}

@app.get("/e5426679666b")
def admin_stats(request: Request, db: Session = Depends(get_db)):
    admin_token = os.getenv("ADMIN_TOKEN")
    if admin_token:
        if request.headers.get("x-admin-token") != admin_token:
            raise HTTPException(status_code=404, detail="Not found")
    total_users = db.query(User).count()
    free_users = db.query(User).filter(User.tier == "free").count()
    starter_users = db.query(User).filter(User.tier == "starter").count()
    pro_users = db.query(User).filter(User.tier == "pro").count()
    total_waitlist = db.query(Waitlist).count()
    total_conversions = db.query(Conversion).count()
    
    return {
        "total_users": total_users,
        "free_users": free_users,
        "starter_users": starter_users,
        "pro_users": pro_users,
        "total_waitlist": total_waitlist,
        "total_conversions": total_conversions
    }

class UpdateProfileRequest(BaseModel):
    first_name: str = None
    last_name: str = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@app.put("/me/profile")
def update_profile(data: UpdateProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.first_name is not None:
        current_user.first_name = data.first_name
    if data.last_name is not None:
        current_user.last_name = data.last_name
    db.add(current_user)
    db.commit()
    return {"message": "Profilo aggiornato"}

@app.put("/me/password")
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Password attuale non corretta")
    current_user.hashed_password = hash_password(data.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password aggiornata"}

@app.delete("/me/subscription")
def cancel_subscription(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.lifetime_pro:
        raise HTTPException(status_code=400, detail="Il tuo piano è gratuito a vita, non puoi annullarlo!")
    current_user.tier = "free"
    current_user.pro_until = None
    db.add(current_user)
    db.commit()
    return {"message": "Abbonamento annullato"}


# CORSMiddleware standard (preflight, ecc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(CORS_ALLOW_ORIGINS),
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
# Ultimo add_middleware = strato più esterno: iniezione CORS senza buffer (streaming PPT ok).
app.add_middleware(OutermostCORSInjection)
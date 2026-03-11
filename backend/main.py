from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import openai
import os
import tempfile
from auth import hash_password, verify_password, create_token, get_current_user
from pydantic import BaseModel
from sqlalchemy.orm import Session
from processors.nlp_parser import parse_transcription
from processors.document_gen import generate_ppt, generate_pdf, generate_html
from fastapi.responses import FileResponse
from models import create_tables, get_db, User, Conversion, Waitlist, SessionLocal
import resend
import stripe
from groq import Groq
load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

resend.api_key = os.getenv("RESEND_API_KEY")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="VoiceMint API")

@app.on_event("startup")
def startup():
    create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://voicemint.vercel.app", "https://voicemint.it", "https://www.voicemint.it"] ,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "VoiceMint API is running!"}

@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    # Controlla che sia un file audio
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Il file deve essere audio")
    
    # Salva il file temporaneamente
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        content = await file.read()
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

# --- Registrazione ---
@app.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Controlla se email già esistente
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    # Crea nuovo utente
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        tier="free"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token({"sub": user.email})
    return {"token": token, "username": user.username, "tier": user.tier}

# --- Login ---
@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    token = create_token({"sub": user.email})
    return {"token": token, "username": user.username, "tier": user.tier}

# --- Profilo utente (richiede login) ---
@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "username": current_user.username,
        "tier": current_user.tier,
        "monthly_usage": current_user.monthly_usage
    }

# --- Genera documento da testo ---
@app.post("/generate")
def generate(
    transcription: str,
    output_type: str = "ppt",  # "ppt", "pdf", "html"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Controlla limite utenti free
    if current_user.tier == "free" and current_user.monthly_usage >= 180:
        raise HTTPException(status_code=403, detail="Limite mensile raggiunto. Passa a Pro!")
    
    # Struttura il testo con GPT-4o
    data = parse_transcription(transcription)
    
    # Genera il file richiesto
    if output_type == "ppt":
        file_path = generate_ppt(data, user_tier=current_user.tier)
    elif output_type == "pdf":
        file_path = generate_pdf(data, user_tier=current_user.tier)
    elif output_type == "html":
        file_path = generate_html(data, user_tier=current_user.tier)
    else:
        raise HTTPException(status_code=400, detail="Tipo non valido. Usa: ppt, pdf, html")
    
    # Salva la conversione nel database
    conversion = Conversion(
        user_id=current_user.id,
        transcription=transcription,
        title=data["title"],
        output_type=output_type,
        file_path=file_path,
    )
    db.add(conversion)
    current_user.monthly_usage += int(len(transcription.split()) /3 )
    db.commit()
    
    return FileResponse(
        file_path,
        filename=f"voicemint_{data['title'][:20]}.{output_type}",
        media_type="application/octet-stream"
    )

class WaitlistRequest(BaseModel):
    email: str

@app.post("/waitlist")
def join_waitlist(data: WaitlistRequest, db: Session = Depends(get_db)):
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
def create_checkout_session(current_user: User = Depends(get_current_user)):
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{
            "price": os.getenv("STRIPE_PRICE_ID"),
            "quantity": 1,
        }],
        success_url="https://voicemint.it/dashboard?upgraded=true",
        cancel_url="https://voicemint.it",
        customer_email=current_user.email,
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
        email = session.get("customer_email")
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.tier = "pro"
            db.commit()
        db.close()
    
    return {"status": "ok"}
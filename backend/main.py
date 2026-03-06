from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import openai
import os
import tempfile
from models import create_tables, get_db, User, Conversion
from auth import hash_password, verify_password, create_token, get_current_user
from pydantic import BaseModel
from sqlalchemy.orm import Session
from processors.nlp_parser import parse_transcription
from processors.document_gen import generate_ppt, generate_pdf, generate_html
from fastapi.responses import FileResponse

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="VoiceMint API")

@app.on_event("startup")
def startup():
    create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
            transcript = openai.audio.transcriptions.create(
                model="whisper-1",
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
        file_path = generate_ppt(data)
    elif output_type == "pdf":
        file_path = generate_pdf(data)
    elif output_type == "html":
        file_path = generate_html(data)
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
    db.commit()
    
    return FileResponse(
        file_path,
        filename=f"voicemint_{data['title'][:20]}.{output_type}",
        media_type="application/octet-stream"
    )
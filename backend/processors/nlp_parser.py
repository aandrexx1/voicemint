import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_transcription(transcription: str) -> dict:
    """
    Prende la trascrizione grezza e la struttura in
    titolo, sottotitolo e bullet points tramite GPT-4o
    """
    
    prompt = f"""
    Analizza questa trascrizione audio e strutturala in formato JSON.
    
    Trascrizione: "{transcription}"
    
    Rispondi SOLO con un JSON valido in questo formato, senza nessun testo aggiuntivo:
    {{
        "title": "titolo principale estratto dal contenuto",
        "subtitle": "sottotitolo o tema principale",
        "bullets": [
            "punto chiave 1",
            "punto chiave 2",
            "punto chiave 3"
        ],
        "summary": "riassunto in 2-3 righe"
    }}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    raw = response.choices[0].message.content.strip()
    
    # Rimuovi eventuali backtick markdown
    raw = raw.replace("```json", "").replace("```", "").strip()
    
    return json.loads(raw)
import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def parse_transcription(transcription: str) -> dict:
    prompt = f"""
Analizza questo testo e restituisci un JSON strutturato per creare una presentazione professionale.

Testo: {transcription}

Rispondi SOLO con un JSON valido in questo formato, senza altro testo:
{{
  "title": "Titolo principale",
  "slides": [
    {{
      "title": "Titolo slide",
      "bullets": ["punto 1", "punto 2", "punto 3"]
    }}
  ]
}}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    
    text = response.choices[0].message.content
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
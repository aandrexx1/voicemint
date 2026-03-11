import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def parse_transcription(transcription: str) -> dict:
    prompt = f"""
Analizza questo testo e restituisci un JSON strutturato per creare una presentazione professionale.

Testo: "{transcription}"

Crea il numero di slide più adatto al contenuto. Se l'utente specifica un numero di slide, rispettalo esattamente.
La prima slide è sempre il titolo, l'ultima è sempre il riepilogo.
Le slide intermedie possono essere di tipo "bullets" o "text" in base al contenuto.
IMPORTANTE: non creare mai due slide "bullets" consecutive con lo stesso argomento — uniscile in una sola.
Se il contenuto è breve, usa 3-4 slide. Se è lungo o l'utente parla a lungo, usa più slide.

Scegli il tema visivo più adatto al contenuto:
- Business/finance → dark blu navy, accenti oro
- Tech/startup → dark nero, accenti verde o ciano  
- Creatività/arte → gradient viola-rosa, testo bianco
- Cibo/lifestyle → sfondo caldo beige, accenti arancione
- Salute/benessere → sfondo bianco, accenti verde
- Se l'utente descrive uno stile specifico, seguilo

Rispondi SOLO con un JSON valido, senza altro testo:
{{
  "title": "Titolo principale",
  "subtitle": "Sottotitolo breve e incisivo",
  "slides": [
    {{
      "type": "bullets",
      "title": "Titolo della slide",
      "content": ["punto 1", "punto 2", "punto 3", "punto 4"]
    }},
    {{
      "type": "text",
      "title": "Titolo della slide",
      "content": "Testo descrittivo della slide"
    }}
  ],
  "summary": "Riepilogo del contenuto in 2-3 frasi.",
  "theme": {{
    "style": "dark",
    "bg_color": "0a0a0a",
    "slide_bg_color": "111111",
    "accent_color": "00D4FF",
    "text_color": "FFFFFF",
    "subtitle_color": "A0A0B0",
    "font_title": "Inter",
    "font_body": "Inter"
  }}
}}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    
    text = response.choices[0].message.content
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
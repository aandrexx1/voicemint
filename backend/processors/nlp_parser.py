import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def parse_transcription(transcription: str) -> dict:
    # Conta le sezioni per guidare Llama
    lines = [l.strip() for l in transcription.split('\n') if l.strip()]
    estimated_sections = max(3, min(8, len([l for l in lines if len(l) > 30])))

    prompt = f"""
Analizza questo testo e crea una presentazione professionale con MOLTE slide tematiche.

Testo: "{transcription}"

REGOLE FONDAMENTALI:
- Il testo fornito ha circa {estimated_sections} sezioni/argomenti distinti
- Crea ESATTAMENTE {estimated_sections} slide intermedie, una per ogni sezione
- Ogni slide copre UN solo argomento specifico del testo
- Tipo "bullets" per elenchi di punti concreti, "text" per concetti narrativi
- MAI due slide bullets consecutive sullo stesso argomento
- Usa TUTTO il contenuto, non saltare sezioni

Scegli il tema visivo più adatto:
- Business/finance → dark blu navy, accenti oro
- Tech/AI/startup → dark nero, accenti ciano
- Creatività/arte → gradient viola-rosa, testo bianco
- Salute/benessere → sfondo scuro, accenti verde
- Se l'utente specifica uno stile, seguilo

Rispondi SOLO con JSON valido, zero testo extra:
{{
  "title": "Titolo principale",
  "subtitle": "Sottotitolo breve e incisivo",
  "slides": [
    {{
      "type": "bullets",
      "title": "Titolo slide 1",
      "content": ["punto 1", "punto 2", "punto 3"]
    }},
    {{
      "type": "text",
      "title": "Titolo slide 2",
      "content": "Testo narrativo della slide"
    }}
  ],
  "summary": "Riepilogo in 2-3 frasi.",
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
        temperature=0.3,
    )
    
    text = response.choices[0].message.content
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
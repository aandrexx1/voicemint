import os
from groq import Groq
import json
import re

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def parse_transcription(transcription: str) -> dict:
    text_in = (transcription or "").strip()
    words = re.findall(r"\w+", text_in)
    wc = len(words)
    # Stima complessità: più parole → più slide. Clamp per evitare output enormi.
    target_content_slides = max(4, min(12, (wc // 120) + 4))

    prompt = f"""
Analizza questo testo e crea una presentazione professionale VARIA e specifica per l'argomento.

Testo: "{text_in}"

REGOLE FONDAMENTALI:
- Crea circa {target_content_slides} slide di contenuto (oltre a titolo e riepilogo). Se il testo è molto breve, fanne almeno 4; se è lungo, fino a 12.
- Ogni slide deve introdurre un punto diverso (no ripetizioni).
- Alterna i tipi: usa "bullets" quando ha senso (3-6 bullet concreti), e "text" per spiegazioni brevi e chiare (max 3-5 frasi).
- Non usare titoli generici (tipo "Introduzione", "Conclusione") a meno che il testo lo richieda: rendili specifici.
- Il titolo principale deve riflettere davvero l'argomento.

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
  "summary_title": "Riepilogo",
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
    # Estrai JSON robustamente (a volte il modello aggiunge testo)
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise
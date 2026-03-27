import os
from groq import Groq
import json
import re

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def _extract_json(text: str) -> dict:
    text = (text or "").strip().replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise

def _clamp(n: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, int(n)))

def parse_transcription(transcription: str) -> dict:
    text_in = (transcription or "").strip()
    words = re.findall(r"\w+", text_in)
    wc = len(words)
    # Stima complessità: più parole → più slide.
    max_content_slides = int(os.getenv("MAX_CONTENT_SLIDES", "18"))
    target_content_slides = _clamp((wc // 110) + 4, 4, max_content_slides)
    if wc >= 900:
        min_content_slides = min(12, max_content_slides)
    elif wc >= 600:
        min_content_slides = min(10, max_content_slides)
    elif wc >= 300:
        min_content_slides = min(8, max_content_slides)
    else:
        min_content_slides = 4
    short_prompt = wc < 30

    prompt = f"""
Analizza questo testo e crea una presentazione professionale VARIA, specifica per l'argomento e NON generica.

Testo: "{text_in}"

REGOLE FONDAMENTALI:
- Devi creare tra {min_content_slides} e {max_content_slides} slide di contenuto (oltre a titolo e riepilogo). Obiettivo: {target_content_slides}.
- Non restituire mai meno di {min_content_slides} slide di contenuto.
- Ogni slide deve introdurre un punto diverso (no ripetizioni).
- Alterna i tipi: usa "bullets" quando ha senso (3-6 bullet concreti), e "text" per spiegazioni brevi e chiare (max 3-5 frasi).
- Non usare titoli generici (tipo "Introduzione", "Conclusione") a meno che il testo lo richieda: rendili specifici.
- Il titolo principale deve riflettere davvero l'argomento.
{"- Se il testo è una richiesta breve (es. \"fammi un riassunto di...\") devi comunque produrre slide utili: definizioni chiave, struttura del programma, concetti fondamentali, errori comuni, esempi, mini-casi, e un piano di studio rapido." if short_prompt else ""}

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
    
    data = _extract_json(response.choices[0].message.content)
    if not isinstance(data, dict):
        data = {"title": "", "subtitle": "", "slides": [], "summary_title": "Riepilogo", "summary": "", "theme": {}}
    slides = data.get("slides")
    if not isinstance(slides, list):
        slides = []
        data["slides"] = slides

    if len(slides) < min_content_slides:
        fix_prompt = f"""
Hai generato solo {len(slides)} slide di contenuto, ma ne servono almeno {min_content_slides}.

INPUT TESTO:
\"\"\"{text_in}\"\"\"

JSON ATTUALE:
{json.dumps(data, ensure_ascii=False)}

COMPITO:
- Espandi la presentazione fino ad avere tra {min_content_slides} e {max_content_slides} slide di contenuto.
- Mantieni titolo e tema.
- Aggiungi nuove slide con titoli specifici e contenuti concreti.
- Rispondi SOLO con JSON valido (stesso schema).
"""
        r2 = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": fix_prompt}],
            temperature=0.3,
        )
        data2 = _extract_json(r2.choices[0].message.content)
        if isinstance(data2, dict) and isinstance(data2.get("slides"), list):
            data = data2

    return data
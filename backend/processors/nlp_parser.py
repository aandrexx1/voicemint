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


def _word_count(text: str) -> int:
    return len(re.findall(r"\w+", (text or "").strip()))


def _slide_content_words(slide: dict) -> int:
    """Somma parole nel campo content di una slide (tipi strutturati)."""
    st = (slide.get("type") or "").lower()
    c = slide.get("content")
    if st in ("text", "quote", "section"):
        return _word_count(c if isinstance(c, str) else str(c or ""))
    if st in ("bullets", "numbered"):
        if not isinstance(c, list):
            return _word_count(str(c))
        return sum(_word_count(str(x)) for x in c)
    if st == "split":
        if isinstance(c, list) and len(c) >= 2:
            return _word_count(str(c[0])) + _word_count(str(c[1]))
        return _word_count(str(c))
    return _word_count(str(c))


def _slide_is_thin(slide: dict) -> bool:
    """True se il content non rispetta minimi per tipo (slide troppo vuote)."""
    st = (slide.get("type") or "").lower()
    c = slide.get("content")
    if st == "text":
        return _word_count(c if isinstance(c, str) else "") < 72
    if st == "quote":
        return _word_count(c if isinstance(c, str) else "") < 56
    if st == "section":
        return _word_count(c if isinstance(c, str) else "") < 28
    if st == "bullets":
        if not isinstance(c, list) or len(c) < 5:
            return True
        if sum(_word_count(str(x)) for x in c) < 88:
            return True
        return any(_word_count(str(x)) < 10 for x in c)
    if st == "numbered":
        if not isinstance(c, list) or len(c) < 4:
            return True
        if sum(_word_count(str(x)) for x in c) < 88:
            return True
        return any(_word_count(str(x)) < 12 for x in c)
    if st == "split":
        if not isinstance(c, list) or len(c) < 2:
            return True
        return _word_count(str(c[0])) < 44 or _word_count(str(c[1])) < 44
    return False


def _slide_critically_thin(slide: dict) -> bool:
    """Slide con così poche parole da rendere evidente la pagina mezza vuota."""
    st = (slide.get("type") or "").lower()
    c = slide.get("content")
    if st == "text":
        return _word_count(c if isinstance(c, str) else "") < 48
    if st == "quote":
        return _word_count(c if isinstance(c, str) else "") < 32
    if st == "bullets" and isinstance(c, list):
        return sum(_word_count(str(x)) for x in c) < 48
    if st == "numbered" and isinstance(c, list):
        return sum(_word_count(str(x)) for x in c) < 48
    if st == "split" and isinstance(c, list) and len(c) >= 2:
        return _word_count(str(c[0])) < 28 or _word_count(str(c[1])) < 28
    return False


def _needs_density_expand(slides: list, source_wc: int, summary: str) -> bool:
    """True se la presentazione è troppo sottile rispetto al testo sorgente."""
    if not slides or not os.getenv("GROQ_API_KEY"):
        return False
    if os.getenv("DENSITY_EXPAND", "1").strip().lower() in ("0", "false", "no"):
        return False

    n = len(slides)
    total = sum(_slide_content_words(s) for s in slides)
    avg = total / max(n, 1)

    if source_wc < 60:
        min_avg = 14
    elif source_wc < 180:
        min_avg = 28
    elif source_wc < 400:
        min_avg = 42
    else:
        min_avg = 52

    sw = _word_count(summary or "")
    summary_thin = source_wc >= 120 and sw < 36

    thin_n = sum(1 for s in slides if _slide_is_thin(s))
    many_thin = thin_n >= max(2, (n + 2) // 3)
    low_avg = avg < min_avg
    critical = any(_slide_critically_thin(s) for s in slides)

    return low_avg or many_thin or summary_thin or critical


def _density_expand_prompt(text_in: str, data: dict) -> str:
    return f"""
Il JSON della presentazione ha ancora TROPPO POCO TESTO per slide (contenuti corti, slide mezze vuote).
Devi RISCRIVERE espandendo il contenuto, usando il testo sorgente sotto. Non accorciare.

TESTO SORGENTE (attingi solo da qui, non inventare fatti estranei):
\"\"\"{text_in}\"\"\"

JSON DA ESPANDERE (mantieni stesso schema, stessi tipi di slide nello stesso ordine, stessi titoli di slide dove sensato):
{json.dumps(data, ensure_ascii=False)}

REGOLE OBBLIGATORIE:
- Per ogni slide: moltiplica le parole nel campo "content" (stesse regole di densità del prompt principale).
- "text": paragrafo lungo (obiettivo 120-200+ parole se il materiale c’è).
- "bullets": 6-9 punti; ogni punto lungo (18+ parole).
- "quote": blocco 4-8 frasi dense.
- "split": due stringhe, ciascuna 90+ parole se possibile.
- "numbered": almeno 5 passi, ognuno 2-4 frasi.
- "section": 2-4 frasi di contesto nel content.
- "summary" e "summary_title": riepilogo finale 6-10 frasi dense.
- Non ridurre il numero di slide; non svuotare campi.
- Rispondi SOLO con JSON valido (stesso schema).
"""


def parse_transcription(transcription: str) -> dict:
    text_in = (transcription or "").strip()
    words = re.findall(r"\w+", text_in)
    wc = len(words)
    # Stima complessità: più parole → più slide.
    max_content_slides = int(os.getenv("MAX_CONTENT_SLIDES", "18"))
    # Meno slide “obiettivo” per lunghi testi → più parole per slide (meno pagine mezze vuote).
    target_content_slides = _clamp((wc // 175) + 4, 4, max_content_slides)
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
- DENSITÀ DEL TESTO (obbligatorio — niente slide mezze vuote): attingi al testo sorgente; sviluppa bene ogni argomento. Vietati titoli lunghi con sotto solo due righe.
  · "text": MINIMO 5-9 frasi dense, stesso tema; includi dettagli, definizioni o esempi tratti dal testo (obiettivo ~120-220 parole quando il materiale c’è).
  · "bullets": 6-9 punti; ogni punto è una frase lunga e concreta (min ~18-35 parole), non etichette da una riga.
  · "quote": 4-8 frasi se il materiale lo consente; deve essere un blocco di testo sostanzioso, non un motto.
  · "split": due stringhe lunghe; OGNI colonna almeno 4-7 frasi (~90-160 parole ciascuna se possibile).
  · "numbered": almeno 5-8 passi; ogni passo = 2-4 frasi o un paragrafo breve, non una sola riga.
  · "section": il campo "content" deve contenere 2-4 frasi di contesto (mai stringa vuota); spiega cosa tratterà la sezione.
  · "summary" (riepilogo finale): 6-10 frasi dense che sintetizzano davvero il discorso.
- VARIETÀ STRUTTURALE (obbligatorio): non limitarti a alternare solo "text" e "bullets". Includi nella presentazione:
  · "section" — slide di sezione (titolo grande + content = 2-4 frasi di contesto)
  · "quote" — blocco citazione/riflessione (content = testo lungo come sopra)
  · "split" — confronto (content = array di ESATTAMENTE 2 stringhe lunghe, sinistra e destra)
  · "numbered" — passi ordinati (content = array di stringhe; verranno numerati 1. 2. 3.)
  · "bullets" — elenco puntato (molti punti, ognuno sviluppato)
  · "text" — paragrafo narrativo unico (come sopra: molte frasi)
- Usa almeno 1 "section", 1 "quote" o "split", e alterna gli altri tipi in modo che non ci siano mai più di 2 slide consecutive dello stesso tipo.
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
      "type": "section",
      "title": "Titolo sezione (capitolo)",
      "content": "2-4 frasi di contesto: cosa tratta la sezione e perché."
    }},
    {{
      "type": "quote",
      "title": "Etichetta breve",
      "content": "Blocco citazione lungo (4-8 frasi dense) tratte dal testo."
    }},
    {{
      "type": "split",
      "title": "Due idee a confronto",
      "content": ["Paragrafo lungo colonna sinistra (4-7 frasi)", "Paragrafo lungo colonna destra (4-7 frasi)"]
    }},
    {{
      "type": "numbered",
      "title": "Passi o priorità",
      "content": ["primo passo sviluppato in 2-4 frasi", "secondo passo…", "terzo passo…"]
    }},
    {{
      "type": "bullets",
      "title": "Titolo slide elenco",
      "content": ["punto 1 lungo e concreto", "punto 2…", "…"]
    }},
    {{
      "type": "text",
      "title": "Titolo slide testo",
      "content": "Paragrafo narrativo denso (5-9 frasi, dettagli ed esempi dal testo)."
    }}
  ],
  "summary_title": "Riepilogo",
  "summary": "Riepilogo in 6-10 frasi dense.",
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
        temperature=0.35,
        max_tokens=16384,
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
- Usa tipi slide vari (section, quote, split, numbered, bullets, text) come nello schema; evita solo text/bullet alternati.
- Per OGNI slide: moltiplica il contenuto testuale (stesse regole di DENSITÀ: testi lunghi, bullet sviluppati, split con paragrafi pieni). Non lasciare campi "content" corti.
- Aggiungi nuove slide con titoli specifici e contenuti concreti.
- Rispondi SOLO con JSON valido (stesso schema).
"""
        r2 = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": fix_prompt}],
            temperature=0.35,
            max_tokens=16384,
        )
        data2 = _extract_json(r2.choices[0].message.content)
        if isinstance(data2, dict) and isinstance(data2.get("slides"), list):
            data = data2

    slides = data.get("slides")
    if isinstance(slides, list) and _needs_density_expand(slides, wc, str(data.get("summary") or "")):
        r3 = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": _density_expand_prompt(text_in, data)}],
            temperature=0.25,
            max_tokens=16384,
        )
        try:
            data3 = _extract_json(r3.choices[0].message.content)
            if isinstance(data3, dict) and isinstance(data3.get("slides"), list) and len(data3["slides"]) > 0:
                data = data3
        except Exception:
            pass

    return data
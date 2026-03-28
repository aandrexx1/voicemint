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


def _infer_presentation_audience_heuristic(text: str) -> str:
    """Se il modello non restituisce presentation_audience, stima work vs school dal lessico."""
    t = (text or "").lower()
    work_kw = (
        "cliente",
        "kpi",
        "azienda",
        "board",
        "revenue",
        "stakeholder",
        "quarter",
        "business",
        "pitch",
        "roi",
        "meeting",
        "corporate",
        "budget",
        "fatturato",
        "shareholder",
        "mercato",
        "vendite",
        "b2b",
        "investitori",
        "quarterly",
        "sales",
        "report",
    )
    school_kw = (
        "esame",
        "professore",
        "lezione",
        "università",
        "compito",
        "materia",
        "classe",
        "tesina",
        "voto",
        "studente",
        "corso",
        "laurea",
        "scuola",
        "interrogazione",
        "dipartimento",
        "cfu",
        "appunti",
        "ripasso",
        "homework",
        "midterm",
        "thesis",
    )
    ws = sum(1 for k in work_kw if k in t)
    ss = sum(1 for k in school_kw if k in t)
    if ws > ss:
        return "work"
    if ss > ws:
        return "school"
    return "school"


def _normalize_presentation_audience(data: dict, text_in: str, study: bool) -> None:
    if study:
        data.pop("presentation_audience", None)
        return
    pa = str(data.get("presentation_audience") or "").strip().lower()
    if pa not in ("work", "school"):
        pa = _infer_presentation_audience_heuristic(text_in)
    data["presentation_audience"] = pa


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


def _slide_is_thin(slide: dict, deck_mode: str = "presentation") -> bool:
    """True se il content non rispetta minimi per tipo (slide troppo vuote)."""
    st = (slide.get("type") or "").lower()
    c = slide.get("content")
    study = deck_mode == "study"
    if st == "text":
        return _word_count(c if isinstance(c, str) else "") < (38 if study else 72)
    if st == "quote":
        return _word_count(c if isinstance(c, str) else "") < (22 if study else 56)
    if st == "section":
        return _word_count(c if isinstance(c, str) else "") < (14 if study else 28)
    if st == "bullets":
        min_items = 4 if study else 5
        min_total = 48 if study else 88
        min_each = 6 if study else 10
        if not isinstance(c, list) or len(c) < min_items:
            return True
        if sum(_word_count(str(x)) for x in c) < min_total:
            return True
        return any(_word_count(str(x)) < min_each for x in c)
    if st == "numbered":
        min_items = 4 if study else 4
        min_total = 55 if study else 88
        min_each = 8 if study else 12
        if not isinstance(c, list) or len(c) < min_items:
            return True
        if sum(_word_count(str(x)) for x in c) < min_total:
            return True
        return any(_word_count(str(x)) < min_each for x in c)
    if st == "split":
        if not isinstance(c, list) or len(c) < 2:
            return True
        lo = 28 if study else 44
        return _word_count(str(c[0])) < lo or _word_count(str(c[1])) < lo
    return False


def _slide_critically_thin(slide: dict, deck_mode: str = "presentation") -> bool:
    """Slide con così poche parole da rendere evidente la pagina mezza vuota."""
    st = (slide.get("type") or "").lower()
    c = slide.get("content")
    study = deck_mode == "study"
    if st == "text":
        return _word_count(c if isinstance(c, str) else "") < (22 if study else 48)
    if st == "quote":
        return _word_count(c if isinstance(c, str) else "") < (14 if study else 32)
    if st == "bullets" and isinstance(c, list):
        return sum(_word_count(str(x)) for x in c) < (28 if study else 48)
    if st == "numbered" and isinstance(c, list):
        return sum(_word_count(str(x)) for x in c) < (28 if study else 48)
    if st == "split" and isinstance(c, list) and len(c) >= 2:
        lo = 16 if study else 28
        return _word_count(str(c[0])) < lo or _word_count(str(c[1])) < lo
    return False


def _needs_density_expand(slides: list, source_wc: int, summary: str, deck_mode: str = "presentation") -> bool:
    """True se la presentazione è troppo sottile rispetto al testo sorgente."""
    if not slides or not os.getenv("GROQ_API_KEY"):
        return False
    if os.getenv("DENSITY_EXPAND", "1").strip().lower() in ("0", "false", "no"):
        return False

    n = len(slides)
    total = sum(_slide_content_words(s) for s in slides)
    avg = total / max(n, 1)
    study = deck_mode == "study"

    if source_wc < 60:
        min_avg = 10 if study else 14
    elif source_wc < 180:
        min_avg = 22 if study else 28
    elif source_wc < 400:
        min_avg = 32 if study else 42
    else:
        min_avg = 40 if study else 52

    sw = _word_count(summary or "")
    summary_thin = source_wc >= 120 and sw < (28 if study else 36)

    thin_n = sum(1 for s in slides if _slide_is_thin(s, deck_mode))
    many_thin = thin_n >= max(2, (n + 2) // 3)
    low_avg = avg < min_avg
    critical = any(_slide_critically_thin(s, deck_mode) for s in slides)

    return low_avg or many_thin or summary_thin or critical


def _density_expand_prompt(text_in: str, data: dict, deck_mode: str = "presentation") -> str:
    study = deck_mode == "study"
    rules = (
        """
REGOLE OBBLIGATORIE (modalità APPUNTI / STUDIO):
- Moltiplica i contenuti come schemi: elenchi, passi, confronti sintetici.
- "bullets": 8-14 punti; ogni punto 8-22 parole (concetti, formule, parole chiave).
- "text": 3-7 frasi compatte (definizione + esempio), max ~130 parole per slide.
- "numbered": 6-10 passi; ogni passo sintetico ma completo.
- "split": due colonne da 50-100 parole con elenchi interni se serve.
- "quote": solo se utile (definizioni); 2-5 frasi.
- "section": 1-3 frasi di intestazione.
- "summary": schema riassuntivo (8-12 frasi dense o elenco concettuale).
"""
        if study
        else """
REGOLE OBBLIGATORIE (modalità PRESENTAZIONE):
- "text": paragrafo lungo (obiettivo 120-200+ parole se il materiale c’è).
- "bullets": 6-9 punti; ogni punto lungo (18+ parole).
- "quote": blocco 4-8 frasi dense.
- "split": due stringhe, ciascina 90+ parole se possibile.
- "numbered": almeno 5 passi, ognuno 2-4 frasi.
- "section": 2-4 frasi di contesto nel content.
- "summary" e "summary_title": riepilogo finale 6-10 frasi dense.
"""
    )
    return f"""
Il JSON della presentazione ha ancora TROPPO POCO CONTENUTO per slide rispetto alle regole della modalità scelta.
Devi RISCRIVERE espandendo il contenuto, usando il testo sorgente sotto. Non accorciare.

TESTO SORGENTE (attingi solo da qui, non inventare fatti estranei):
\"\"\"{text_in}\"\"\"

JSON DA ESPANDERE (mantieni stesso schema, stessi tipi di slide nello stesso ordine, stessi titoli di slide dove sensato):
{json.dumps(data, ensure_ascii=False)}
{rules}
- Non ridurre il numero di slide; non svuotare campi.
- Rispondi SOLO con JSON valido (stesso schema).
"""


def parse_transcription(transcription: str, deck_mode: str = "presentation") -> dict:
    deck_mode = "study" if (deck_mode or "").strip().lower() == "study" else "presentation"
    study = deck_mode == "study"
    text_in = (transcription or "").strip()
    words = re.findall(r"\w+", text_in)
    wc = len(words)
    max_content_slides = int(os.getenv("MAX_CONTENT_SLIDES", "18"))

    if study:
        target_content_slides = _clamp((wc // 115) + 5, 5, max_content_slides)
        if wc >= 900:
            min_content_slides = min(14, max_content_slides)
        elif wc >= 600:
            min_content_slides = min(12, max_content_slides)
        elif wc >= 300:
            min_content_slides = min(10, max_content_slides)
        else:
            min_content_slides = 5
    else:
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

    mode_intro = (
        """
MODALITÀ: APPUNTI PER STUDIO (ripasso, schemi, memorizzazione — NON un discorso da leggere in pubblico).
Crea contenuti strutturati per studiare: elenchi, passi, confronti sintetici, definizioni compatte.
"""
        if study
        else """
MODALITÀ: PRESENTAZIONE ORALE (scuola/lavoro): contenuti da esporre a voce — chiarezza, filo logico, slide non sovraccariche di testo da leggere parola per parola.
"""
    )

    density_block = (
        """
- DENSITÀ (modalità STUDIO — niente slide vuote):
  · "bullets": 8-14 punti; ogni punto è una riga di schema (circa 8-22 parole): parole chiave, definizioni brevi, formule; puoi usare "→" o ":".
  · "numbered": 6-10 passi per procedure, scalette, algoritmi da ricordare; ogni passo sintetico ma completo (1-3 frasi).
  · "text": 3-7 frasi compatte (definizione + esempio minimo) o fino a ~130 parole; NO saggi lunghi.
  · "split": confronto sintetico tra due idee; ogni colonna 50-110 parole con sottoelenchi se utile.
  · "quote": al massimo 1 slide di questo tipo; solo per definizioni/formule/testi da memorizzare (2-5 frasi).
  · "section": 1-3 frasi che introducono l'argomento del blocco.
  · "summary": schema riassuntivo (8-12 frasi) o riepilogo a punti concettuali.
"""
        if study
        else """
- DENSITÀ DEL TESTO (obbligatorio — niente slide mezze vuote): attingi al testo sorgente; sviluppa bene ogni argomento. Vietati titoli lunghi con sotto solo due righe.
  · "text": MINIMO 5-9 frasi dense, stesso tema; obiettivo ~120-220 parole quando il materiale c’è.
  · "bullets": 6-9 punti; ogni punto è una frase lunga e concreta (min ~18-35 parole), non etichette da una riga.
  · "quote": 4-8 frasi se il materiale lo consente; blocco sostanzioso, non un motto.
  · "split": due stringhe lunghe; OGNI colonna almeno 4-7 frasi (~90-160 parole ciascuna se possibile).
  · "numbered": almeno 5-8 passi; ogni passo = 2-4 frasi o un paragrafo breve.
  · "section": il campo "content" deve contenere 2-4 frasi di contesto (mai stringa vuota).
  · "summary" (riepilogo finale): 6-10 frasi dense che sintetizzano davvero il discorso.
"""
    )

    variety_block = (
        """
- VARIETÀ (STUDIO): privilegia "bullets" e "numbered"; includi almeno 2 "section"; usa "split" per confronti; al massimo 1 "quote". Non più di 2 slide consecutive dello stesso tipo.
"""
        if study
        else """
- VARIETÀ STRUTTURALE: includi "section", almeno uno tra "quote" e "split", e alterna i tipi (non più di 2 slide consecutive uguali).
"""
    )

    audience_rules = ""
    json_audience_line = ""
    if not study:
        audience_rules = """
- CONTESTO PRESENTAZIONE (obbligatorio): nel JSON includi il campo "presentation_audience" con valore ESATTAMENTE "work" oppure "school":
  · "work" — contesto lavorativo/aziendale: riunioni, clienti, pitch, report, strategia, KPI, progetto professionale, corporate, board.
  · "school" — contesto scolastico o accademico: lezione, esame, compito, materia, corso, tesina, professore, università.
  Decidi in base al testo e al lessico. Non usare lo stesso stile per un pitch aziendale e per una tesina: classifica correttamente.
"""
        json_audience_line = '\n  "presentation_audience": "school",'

    prompt = f"""
Analizza questo testo e crea una presentazione professionale VARIA, specifica per l'argomento e NON generica.
{mode_intro}
Testo: "{text_in}"

REGOLE FONDAMENTALI:
- Devi creare tra {min_content_slides} e {max_content_slides} slide di contenuto (oltre a titolo e riepilogo). Obiettivo: {target_content_slides}.
- Non restituire mai meno di {min_content_slides} slide di contenuto.
- Ogni slide deve introdurre un punto diverso (no ripetizioni).
{density_block}
{variety_block}
- Non usare titoli generici (tipo "Introduzione", "Conclusione") a meno che il testo lo richieda: rendili specifici.
- Il titolo principale deve riflettere davvero l'argomento.
{"- Se il testo è una richiesta breve (es. \"fammi un riassunto di...\") devi comunque produrre slide utili: definizioni chiave, struttura del programma, concetti fondamentali, errori comuni, esempi, mini-casi, e un piano di studio rapido." if short_prompt else ""}
{audience_rules}
Scegli il tema visivo più adatto:
- Business/finance → dark blu navy, accenti oro
- Tech/AI/startup → dark nero, accenti ciano
- Creatività/arte → gradient viola-rosa, testo bianco
- Salute/benessere → sfondo scuro, accenti verde
- Se l'utente specifica uno stile, seguilo

Rispondi SOLO con JSON valido, zero testo extra:
{{
  "title": "Titolo principale",
  "subtitle": "Sottotitolo breve e incisivo",{json_audience_line}
  "slides": [
    {{
      "type": "section",
      "title": "Titolo sezione (capitolo)",
      "content": "Contesto della sezione (1-4 frasi secondo la modalità)."
    }},
    {{
      "type": "quote",
      "title": "Etichetta breve",
      "content": "Solo se serve: definizione o testo da ricordare."
    }},
    {{
      "type": "split",
      "title": "Due idee a confronto",
      "content": ["Colonna sinistra (schema)", "Colonna destra (schema)"]
    }},
    {{
      "type": "numbered",
      "title": "Passi o priorità",
      "content": ["passo 1", "passo 2", "passo 3"]
    }},
    {{
      "type": "bullets",
      "title": "Titolo slide elenco",
      "content": ["punto schema 1", "punto schema 2", "…"]
    }},
    {{
      "type": "text",
      "title": "Titolo slide testo",
      "content": "Paragrafo secondo la modalità (compatto per studio, narrativo per presentazione)."
    }}
  ],
  "summary_title": "Riepilogo",
  "summary": "Riepilogo adatto alla modalità.",
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
        mode_hint = (
            "Modalità STUDIO: più slide con schemi, bullets e numbered; contenuti sintetici per ripasso."
            if study
            else "Modalità PRESENTAZIONE: contenuti per esposizione orale; paragrafi e punti sviluppati."
        )
        fix_audience = (
            ""
            if study
            else '- Mantieni "presentation_audience" ("work" o "school") coerente con il testo.\n'
        )
        fix_prompt = f"""
Hai generato solo {len(slides)} slide di contenuto, ma ne servono almeno {min_content_slides}.

Modalità: {deck_mode}. {mode_hint}

INPUT TESTO:
\"\"\"{text_in}\"\"\"

JSON ATTUALE:
{json.dumps(data, ensure_ascii=False)}

COMPITO:
- Espandi la presentazione fino ad avere tra {min_content_slides} e {max_content_slides} slide di contenuto.
- Mantieni titolo e tema.
{fix_audience}- Usa tipi slide vari (section, quote, split, numbered, bullets, text) come nello schema; evita solo text/bullet alternati.
- Per OGNI slide: moltiplica il contenuto testuale (stesse regole di DENSITÀ della modalità). Non lasciare campi "content" corti.
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
    if isinstance(slides, list) and _needs_density_expand(
        slides, wc, str(data.get("summary") or ""), deck_mode
    ):
        r3 = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": _density_expand_prompt(text_in, data, deck_mode)}],
            temperature=0.25,
            max_tokens=16384,
        )
        try:
            data3 = _extract_json(r3.choices[0].message.content)
            if isinstance(data3, dict) and isinstance(data3.get("slides"), list) and len(data3["slides"]) > 0:
                data = data3
        except Exception:
            pass

    if isinstance(data, dict):
        data["deck_mode"] = deck_mode
        _normalize_presentation_audience(data, text_in, study)
    return data
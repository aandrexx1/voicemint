"""
Immagini da web (API Pexels) per copertina e slide di contenuto.

Richiede PEXELS_API_KEY: https://www.pexels.com/api/
Senza chiave le funzioni restituiscono None / dict vuoti.
"""
from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path

import httpx

_CACHE_DIR = Path(__file__).resolve().parents[1] / "cache" / "topic_images"

# Parole “da presentazione” che su Pexels portano a risultati generici o fuori tema.
_STOPWORDS_IT_EN = frozenset(
    {
        "the",
        "and",
        "for",
        "with",
        "from",
        "that",
        "this",
        "these",
        "those",
        "una",
        "uno",
        "un",
        "degli",
        "delle",
        "dei",
        "del",
        "della",
        "dell",
        "nel",
        "nella",
        "sul",
        "sulla",
        "tra",
        "fra",
        "per",
        "come",
        "cosa",
        "alla",
        "alle",
        "agli",
        "negli",
        "nelle",
        "introduzione",
        "conclusione",
        "riepilogo",
        "sommario",
        "presentazione",
        "slide",
        "capitolo",
        "sezione",
        "parte",
        "analisi",
        "overview",
        "introduction",
        "summary",
        "chapter",
        "confronto",
        "comparazione",
        "comparison",
        "versus",
        "contro",
        "sfide",
        "sfida",
        "impatto",
        "impatti",
        "efficienza",
        "costi",
        "costo",
        "vantaggi",
        "svantaggi",
    }
)

# Se il deck parla di auto/motori, queste parole nel titolo slide spingono Pexels verso “natura” / stock casuali.
_GENERIC_ENV_TERMS = frozenset(
    {
        "ambientale",
        "ambientali",
        "environment",
        "environmental",
        "ecologia",
        "ecologico",
        "climate",
        "natura",
        "nature",
        "green",
        "sostenibile",
        "sustainability",
    }
)

# Segnali di dominio tecnico (auto / mobilità): in presenza, togliamo i termini “ambientali” dalla sola query immagine.
_TECH_MOBILITY_HINTS = frozenset(
    {
        "veicoli",
        "veicolo",
        "auto",
        "automotive",
        "automobile",
        "car",
        "cars",
        "motor",
        "motori",
        "motore",
        "engine",
        "engines",
        "elettrico",
        "elettrici",
        "elettrica",
        "elettriche",
        "electric",
        "combustione",
        "combustion",
        "interna",
        "internal",
        "diesel",
        "benzina",
        "hybrid",
        "ibrido",
        "battery",
        "batteria",
        "ev",
        "ice",
        "suv",
        "charging",
        "ricarica",
    }
)


def _enabled() -> bool:
    return os.getenv("ENABLE_STOCK_IMAGES", "1").strip().lower() in ("1", "true", "yes")


def _normalize_words(text: str) -> list[str]:
    raw = re.sub(r"[^\w\s]", " ", str(text or ""), flags=re.UNICODE).lower()
    return [w for w in raw.split() if len(w) > 2]


def _dedupe_preserve(words: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for w in words:
        if w in seen:
            continue
        seen.add(w)
        out.append(w)
    return out


def _strip_stopwords(words: list[str]) -> list[str]:
    return [w for w in words if w not in _STOPWORDS_IT_EN]


def _mobility_domain(words: list[str]) -> bool:
    s = set(words)
    return bool(s & _TECH_MOBILITY_HINTS)


def _filter_env_if_mobility(words: list[str]) -> list[str]:
    if not _mobility_domain(words):
        return words
    return [w for w in words if w not in _GENERIC_ENV_TERMS]


def deck_image_query(data: dict, max_words: int = 10) -> str:
    """
    Query principale da titolo/sottotitolo (+ titoli prime slide): sostantivi utili, senza boilerplate slide.
    """
    parts: list[str] = [
        str(data.get("title") or ""),
        str(data.get("subtitle") or ""),
    ]
    for s in (data.get("slides") or [])[:4]:
        if isinstance(s, dict):
            parts.append(str(s.get("title") or ""))
    raw = " ".join(parts)
    words = _dedupe_preserve(_strip_stopwords(_normalize_words(raw)))
    words = _filter_env_if_mobility(words)
    words = words[:max_words]
    q = " ".join(words).strip()
    return q if q else "professional presentation"


def keywords_for_stock_image(data: dict) -> str:
    """Combina titolo, sottotitolo e prime slide per una query di ricerca (copertina)."""
    return deck_image_query(data, max_words=10)


def deck_topic_prefix(data: dict, max_words: int = 5) -> str:
    """Ancoraggio breve coerente con deck_image_query."""
    q = deck_image_query(data, max_words=max_words)
    return q[:200].strip()


def _slide_title_substantive(slide_title: str) -> list[str]:
    words = _dedupe_preserve(_strip_stopwords(_normalize_words(slide_title)))
    return _filter_env_if_mobility(words)


def slide_image_query(data: dict, slide_title: str) -> str:
    """
    Query per slide contenuto: nucleo del deck + dettaglio slide solo se il titolo slide aggiunge termini concreti.
    Evita "Introduzione al confronto" → film/cose casuali.
    """
    deck = deck_image_query(data, max_words=10)
    deck_words = _normalize_words(deck)
    slide_words = _slide_title_substantive(slide_title)
    # Solo parole slide non già nel deck (varietà senza rumore)
    extra = [w for w in slide_words if w not in set(deck_words)]
    if len(extra) >= 2:
        q = f"{deck} {' '.join(extra[:5])}".strip()
    elif len(slide_words) >= 2:
        q = f"{deck} {' '.join(slide_words[:5])}".strip()
    else:
        q = deck
    return q[:120].strip()


def _download_pexels_to_file(client: httpx.Client, api_key: str, query: str, dest: Path, size: str = "large") -> bool:
    if dest.exists() and dest.stat().st_size > 2048:
        return True
    try:
        r = client.get(
            "https://api.pexels.com/v1/search",
            params={
                "query": query[:120],
                "per_page": 1,
                "orientation": "landscape",
                "size": size,
            },
            headers={"Authorization": api_key},
        )
        r.raise_for_status()
        photos = r.json().get("photos") or []
        if not photos:
            return False
        src = (photos[0].get("src") or {}).get("large2x") or (photos[0].get("src") or {}).get("large")
        if not src:
            src = (photos[0].get("src") or {}).get("medium")
        if not src:
            return False
        ir = client.get(src, follow_redirects=True, timeout=45.0)
        ir.raise_for_status()
        dest.write_bytes(ir.content)
    except Exception:
        try:
            if dest.exists():
                dest.unlink(missing_ok=True)
        except Exception:
            pass
        return False
    return dest.exists() and dest.stat().st_size > 2048


def fetch_topic_image_path(data: dict) -> Path | None:
    """Una foto landscape per titolo / fascia studio."""
    if not _enabled():
        return None
    api_key = os.getenv("PEXELS_API_KEY", "").strip()
    if not api_key:
        return None
    query = keywords_for_stock_image(data)
    h = hashlib.sha256(f"pexels|{query}".encode("utf-8")).hexdigest()[:20]
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    dest = _CACHE_DIR / f"{h}.jpg"
    try:
        with httpx.Client(timeout=25.0) as client:
            if not _download_pexels_to_file(client, api_key, query, dest, size="large"):
                # Fallback: solo parole più dense dal titolo (senza sottotitolo “ambientale” dominante)
                q2 = deck_image_query({"title": data.get("title"), "subtitle": "", "slides": data.get("slides")}, max_words=8)
                if q2 and q2 != query:
                    dest2 = _CACHE_DIR / f"{h}_t.jpg"
                    if _download_pexels_to_file(client, api_key, q2, dest2, size="large"):
                        return dest2
                return None
    except Exception:
        return None
    return dest if dest.exists() else None


def fetch_content_slide_images_map(data: dict, max_slides: int = 5) -> dict[int, Path]:
    """
    Per ogni slide in data['slides'] (indice i), una foto da Pexels basata sul titolo slide.
    Usato per miniature a destra su slide testo/elenco (presentazione e studio).
    """
    out: dict[int, Path] = {}
    if not _enabled():
        return out
    api_key = os.getenv("PEXELS_API_KEY", "").strip()
    if not api_key:
        return out
    slides = data.get("slides") or []
    if not slides:
        return out
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    seen_q: set[str] = set()
    try:
        with httpx.Client(timeout=25.0) as client:
            for i, s in enumerate(slides):
                if len(out) >= max_slides:
                    break
                if not isinstance(s, dict):
                    continue
                title = str(s.get("title") or "")
                q = slide_image_query(data, title)
                if not q or len(q) < 3:
                    continue
                qk = q.lower()[:80]
                if qk in seen_q:
                    q = f"{q} detail"
                seen_q.add(qk[:80])

                h = hashlib.sha256(f"pexels_inline|{i}|{q}".encode("utf-8")).hexdigest()[:22]
                dest = _CACHE_DIR / f"inline_{h}.jpg"
                ok = _download_pexels_to_file(client, api_key, q, dest, size="medium")
                if not ok:
                    q_fallback = deck_image_query(data, max_words=8)
                    if q_fallback and q_fallback != q:
                        h2 = hashlib.sha256(f"pexels_inline_fb|{i}|{q_fallback}".encode("utf-8")).hexdigest()[:22]
                        dest_fb = _CACHE_DIR / f"inline_{h2}.jpg"
                        ok = _download_pexels_to_file(client, api_key, q_fallback, dest_fb, size="medium")
                        if ok:
                            out[i] = dest_fb
                    continue
                out[i] = dest
    except Exception:
        return out
    return out

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


def _enabled() -> bool:
    return os.getenv("ENABLE_STOCK_IMAGES", "1").strip().lower() in ("1", "true", "yes")


def keywords_for_stock_image(data: dict) -> str:
    """Combina titolo, sottotitolo e prime slide per una query di ricerca."""
    parts: list[str] = [
        str(data.get("title") or ""),
        str(data.get("subtitle") or ""),
    ]
    for s in (data.get("slides") or [])[:4]:
        if isinstance(s, dict):
            parts.append(str(s.get("title") or ""))
    raw = " ".join(parts)
    raw = re.sub(r"[^\w\s]", " ", raw, flags=re.UNICODE)
    words = [w for w in raw.split() if len(w) > 2][:10]
    q = " ".join(words).strip()
    return q if q else "education learning"


def _query_from_slide_title(title: str) -> str:
    raw = re.sub(r"[^\w\s]", " ", str(title or ""), flags=re.UNICODE)
    words = [w for w in raw.split() if len(w) > 2][:8]
    q = " ".join(words).strip()
    return q if len(q) >= 3 else ""


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
                q = _query_from_slide_title(str(s.get("title") or ""))
                if not q:
                    continue
                qk = q.lower()[:80]
                if qk in seen_q:
                    q = f"{q} theme"
                seen_q.add(qk[:80])

                h = hashlib.sha256(f"pexels_inline|{i}|{q}".encode("utf-8")).hexdigest()[:22]
                dest = _CACHE_DIR / f"inline_{h}.jpg"
                if _download_pexels_to_file(client, api_key, q, dest, size="medium"):
                    out[i] = dest
    except Exception:
        return out
    return out

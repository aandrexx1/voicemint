"""
Profili di layout PPTX guidati dall'argomento (campo theme.layout_profile dal parser NLP).
Ogni profilo definisce geometria, gerarchia tipografica e stile elenchi coerenti con il dominio.
"""
from __future__ import annotations

import hashlib
from typing import Any

# Deve coincidere con i valori richiesti nel prompt di nlp_parser.py
ALLOWED_LAYOUT_PROFILES: frozenset[str] = frozenset(
    {
        "scholarly_notebook",
        "executive_premium",
        "tech_futurist",
        "medical_warm",
        "creative_studio",
        "history_editorial",
        "startup_pitch",
        "exam_focus",
        "balanced_modern",
    }
)

# bullet_style: "cards" | "dots" | "mixed" (mixed = alterna in base a slide_style)
_DEFAULT = {
    "title_variant": 0,
    "section_bar": "alternate",
    "bullet_style": "mixed",
    "text_top_bar": False,
    "summary_labeled": True,
    "title_font_pt": 44,
    "subtitle_font_pt": 20,
    "section_title_pt": 34,
}

LAYOUT_PROFILES: dict[str, dict[str, Any]] = {
    # Appunti, analisi testi, filosofia — editoriale, fascia verticale, card per schemi
    "scholarly_notebook": {
        **_DEFAULT,
        "title_variant": 1,
        "section_bar": "vertical",
        "bullet_style": "cards",
        "text_top_bar": False,
        "summary_labeled": True,
        "title_font_pt": 44,
        "section_title_pt": 36,
    },
    # Board, strategia, corporate — pulito, punti elenco discreti, titolo centrale forte
    "executive_premium": {
        **_DEFAULT,
        "title_variant": 0,
        "section_bar": "horizontal",
        "bullet_style": "dots",
        "text_top_bar": False,
        "summary_labeled": False,
        "title_font_pt": 46,
        "subtitle_font_pt": 19,
    },
    # AI, software, infra — fascia alta, ciano/tech, card moderne
    "tech_futurist": {
        **_DEFAULT,
        "title_variant": 2,
        "section_bar": "alternate",
        "bullet_style": "mixed",
        "text_top_bar": True,
        "summary_labeled": True,
        "title_font_pt": 44,
    },
    # Salute, biologia — morbido, card, riepilogo con etichetta
    "medical_warm": {
        **_DEFAULT,
        "title_variant": 2,
        "section_bar": "vertical",
        "bullet_style": "cards",
        "text_top_bar": False,
        "summary_labeled": True,
        "title_font_pt": 43,
    },
    # Arte, design — barra in basso, contrasto, elenchi misti
    "creative_studio": {
        **_DEFAULT,
        "title_variant": 3,
        "section_bar": "alternate",
        "bullet_style": "mixed",
        "text_top_bar": True,
        "summary_labeled": True,
        "title_font_pt": 45,
    },
    # Storia, civiltà — editoriale a sinistra, punti classici
    "history_editorial": {
        **_DEFAULT,
        "title_variant": 1,
        "section_bar": "vertical",
        "bullet_style": "dots",
        "text_top_bar": False,
        "summary_labeled": True,
        "title_font_pt": 44,
    },
    # Pitch — impatto, titolo grande, sezioni orizzontali
    "startup_pitch": {
        **_DEFAULT,
        "title_variant": 0,
        "section_bar": "horizontal",
        "bullet_style": "cards",
        "text_top_bar": False,
        "summary_labeled": False,
        "title_font_pt": 50,
        "subtitle_font_pt": 21,
    },
    # Ripasso — denso, card per memorizzare
    "exam_focus": {
        **_DEFAULT,
        "title_variant": 1,
        "section_bar": "vertical",
        "bullet_style": "cards",
        "text_top_bar": False,
        "summary_labeled": True,
        "title_font_pt": 42,
        "section_title_pt": 36,
    },
    # Fallback neutro
    "balanced_modern": {
        **_DEFAULT,
        "title_variant": 0,
        "section_bar": "alternate",
        "bullet_style": "mixed",
        "text_top_bar": False,
        "summary_labeled": True,
        "title_font_pt": 44,
    },
}


def normalize_layout_profile_key(raw: str | None) -> str:
    if not raw or not str(raw).strip():
        return "balanced_modern"
    k = str(raw).strip().lower().replace(" ", "_").replace("-", "_")
    return k if k in ALLOWED_LAYOUT_PROFILES else "balanced_modern"


def resolve_topic_layout(data: dict) -> dict[str, Any]:
    """
    Unisce il profilo scelto dal modello con un jitter stabile (titolo+profilo)
    per micro-variazioni tra slide senza layout predefiniti identici per tutti.
    """
    theme = data.get("theme") if isinstance(data.get("theme"), dict) else {}
    key = normalize_layout_profile_key(theme.get("layout_profile"))
    base = {**LAYOUT_PROFILES.get(key, LAYOUT_PROFILES["balanced_modern"])}
    seed = f"{key}|{data.get('title') or ''}|{data.get('subtitle') or ''}"
    jitter = int(hashlib.sha256(seed.encode("utf-8")).hexdigest(), 16) % 8
    base["profile_key"] = key
    base["slide_jitter"] = jitter
    return base


def slide_style_index(layout: dict, slide_idx: int) -> int:
    return (layout["slide_jitter"] + slide_idx) % 4


def use_bullet_cards(layout: dict, slide_style: int) -> bool:
    st = layout.get("bullet_style", "mixed")
    if st == "cards":
        return True
    if st == "dots":
        return False
    return slide_style in (1, 3)


def text_uses_top_bar(layout: dict, slide_style: int) -> bool:
    """Profilo può forzare top bar; altrimenti alterna con slide_style."""
    if layout.get("text_top_bar"):
        return True
    return slide_style in (1, 2)


def summary_is_labeled(layout: dict, slide_style: int) -> bool:
    if not layout.get("summary_labeled"):
        return False
    return slide_style in (0, 2)


def section_bar_is_vertical(layout: dict, slide_style: int) -> bool:
    """horizontal = barra sotto il titolo; vertical = colonna a sinistra."""
    sb = layout.get("section_bar") or "alternate"
    if sb == "vertical":
        return True
    if sb == "horizontal":
        return False
    return slide_style in (1, 3)

import os
import uuid
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_SHAPE, MSO_SHAPE_TYPE, PP_PLACEHOLDER
from pptx.enum.text import PP_ALIGN, MSO_AUTO_SIZE
from pptx.dml.color import RGBColor
from playwright.sync_api import sync_playwright
import math
import hashlib
from pathlib import Path
import json
import httpx

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "templates" / "pptx"
TEMPLATES_CACHE_DIR = Path(__file__).resolve().parents[1] / "templates" / ".cache"
TEMPLATES_CACHE_DIR.mkdir(parents=True, exist_ok=True)

def _valid_template_path(p: Path) -> bool:
    if p.suffix.lower() != ".pptx":
        return False
    if p.name.startswith("~$") or p.name.startswith("._"):
        return False
    if "__MACOSX" in p.parts:
        return False
    return True

def _discover_templates():
    if not TEMPLATES_DIR.exists():
        return []
    return sorted([p for p in TEMPLATES_DIR.rglob("*.pptx") if _valid_template_path(p)])

def _safe_template_filename(name: str) -> str:
    cleaned = "".join(ch for ch in (name or "template") if ch.isalnum() or ch in ("-", "_", "."))
    if not cleaned.lower().endswith(".pptx"):
        cleaned += ".pptx"
    return cleaned or "template.pptx"

def _download_remote_template(url: str, template_id: str) -> Path | None:
    if not url:
        return None
    try:
        ext = ".pptx" if not url.lower().endswith(".pptx") else ""
        local_name = _safe_template_filename(f"{template_id}{ext}")
        local_path = TEMPLATES_CACHE_DIR / local_name
        if local_path.exists() and local_path.stat().st_size > 0:
            return local_path
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            r = client.get(url)
            r.raise_for_status()
            local_path.write_bytes(r.content)
        return local_path if local_path.stat().st_size > 0 else None
    except Exception as e:
        print(f"remote template download failed ({template_id}): {e}")
        return None

def _discover_remote_templates():
    """
    Legge un manifest JSON remoto (es. Cloudflare R2 public URL) con formato:
    { "templates": [ { "id": "boxvie", "url": "https://.../boxvie.pptx" }, ... ] }
    oppure lista diretta [{...}, {...}]
    """
    manifest_url = os.getenv("TEMPLATE_MANIFEST_URL", "").strip()
    if not manifest_url:
        return []
    try:
        with httpx.Client(timeout=20.0, follow_redirects=True) as client:
            r = client.get(manifest_url)
            r.raise_for_status()
            payload = r.json()
    except Exception as e:
        print(f"template manifest fetch failed: {e}")
        return []

    items = payload.get("templates", []) if isinstance(payload, dict) else payload
    out = []
    if not isinstance(items, list):
        return out
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        tid = str(item.get("id") or f"tpl_{i}")
        url = str(item.get("url") or "").strip()
        if not url:
            continue
        p = _download_remote_template(url, tid)
        if p and _valid_template_path(p):
            out.append(p)
    return out

def _find_named_deck_template(study: bool) -> Path | None:
    """
    Trova un .pptx il cui nome contiene il marker della modalità, es.:
    - Nome_Template_Study.pptx (sottostringa '_Template_Study')
    - oppure Template_Study.pptx (inizia per 'Template_Study')
    Stesso schema per Presentation con '_Template_Presentation' / 'Template_Presentation'.
    """
    matches = []
    for p in _discover_templates():
        n = p.name.lower()
        if study:
            ok = "_template_study" in n or n.startswith("template_study")
        else:
            ok = "_template_presentation" in n or n.startswith("template_presentation")
        if ok:
            matches.append(p)
    return min(matches, key=lambda x: len(x.name)) if matches else None


def _pick_template(data: dict):
    """
    Seleziona il .pptx in base a deck_mode:
    - study → file con '_Template_Study' nel nome (es. Affantie_Template_Study.pptx) o Template_Study.pptx
    - presentation → '_Template_Presentation' o Template_Presentation.pptx
    Poi: manifest remoto, altrimenti qualsiasi template locale (hash deterministico).
    """
    mode = (data.get("deck_mode") or "presentation").strip().lower()
    if mode == "study":
        named = _find_named_deck_template(study=True)
        if named is not None:
            return named
    else:
        named = _find_named_deck_template(study=False)
        if named is not None:
            return named

    templates = _discover_remote_templates()
    if not templates:
        templates = _discover_templates()
    if not templates:
        return None
    seed = (data.get("title") or "") + "|" + (data.get("subtitle") or "") + "|" + mode
    idx = int(hashlib.sha256(seed.encode("utf-8")).hexdigest(), 16) % len(templates)
    return templates[idx]

def _clear_all_slides(prs: Presentation):
    # python-pptx non espone delete slide pubblico: usiamo API interna in modo sicuro
    while len(prs.slides) > 0:
        r_id = prs.slides._sldIdLst[0].rId
        prs.part.drop_rel(r_id)
        del prs.slides._sldIdLst[0]

def _first_body_placeholder(slide):
    for sh in slide.placeholders:
        try:
            ph_type = sh.placeholder_format.type
            # BODY(2) / OBJECT(7) / TEXT(14) / CONTENT(19)
            if int(ph_type) in (2, 7, 14, 19):
                return sh
        except Exception:
            continue
    return None


def _theme_dict(data: dict) -> dict:
    return data.get("theme") if isinstance(data.get("theme"), dict) else {}


def _theme_rgb(theme: dict, key: str, default_hex: str) -> RGBColor:
    raw = str(theme.get(key) or default_hex).lstrip("#")
    if len(raw) < 6:
        raw = default_hex.lstrip("#")
    try:
        return RGBColor(int(raw[0:2], 16), int(raw[2:4], 16), int(raw[4:6], 16))
    except Exception:
        return hex_to_rgb("#" + default_hex)


def _apply_slide_background_solid(slide, rgb: RGBColor):
    """Copre lo sfondo master/template con un colore pieno (niente immagini stock di sfondo)."""
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def _remove_shape_safely(shape):
    try:
        el = shape.element
        parent = el.getparent()
        if parent is not None:
            parent.remove(el)
    except Exception:
        pass


# Placeholder layout "inserisci immagine" (cerchio/icona): shape_type PLACEHOLDER, non PICTURE
_PH_TYPES_TO_STRIP = frozenset(
    {
        int(PP_PLACEHOLDER.PICTURE),
        int(PP_PLACEHOLDER.BITMAP),
        int(PP_PLACEHOLDER.MEDIA_CLIP),
        int(PP_PLACEHOLDER.SLIDE_IMAGE),
        int(PP_PLACEHOLDER.ORG_CHART),
        int(PP_PLACEHOLDER.CHART),
    }
)


def _flatten_shapes(slide):
    """Tutte le forme incluso dentro i GROUP (layout spesso annidati)."""
    acc = []

    def walk(coll):
        for s in list(coll):
            acc.append(s)
            if s.shape_type == MSO_SHAPE_TYPE.GROUP:
                walk(s.shapes)

    walk(slide.shapes)
    return acc


def _remove_picture_and_media_placeholders(slide):
    """Rimuove i riquadri "immagine" / media del template (es. cerchio con icona foto)."""
    for shape in _flatten_shapes(slide):
        try:
            if not getattr(shape, "is_placeholder", False):
                continue
            ph_t = int(shape.placeholder_format.type)
            if ph_t in _PH_TYPES_TO_STRIP:
                _remove_shape_safely(shape)
        except Exception:
            continue


def _remove_large_decorative_ovals(slide, prs: Presentation, area_ratio: float = 0.06):
    """
    Ovale / rettangoli arrotondati molto grandi senza testo (spesso maschera per foto stock).
    """
    slide_area = float(prs.slide_width * prs.slide_height)
    if slide_area <= 0:
        return
    ovalish = frozenset(
        {
            MSO_AUTO_SHAPE_TYPE.OVAL,
            MSO_AUTO_SHAPE_TYPE.OVAL_CALLOUT,
            MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE,
            MSO_AUTO_SHAPE_TYPE.ROUND_1_RECTANGLE,
            MSO_AUTO_SHAPE_TYPE.ROUND_2_DIAG_RECTANGLE,
            MSO_AUTO_SHAPE_TYPE.ROUND_2_SAME_RECTANGLE,
        }
    )
    for shape in _flatten_shapes(slide):
        try:
            if shape.shape_type != MSO_SHAPE_TYPE.AUTO_SHAPE:
                continue
            if shape.auto_shape_type not in ovalish:
                continue
            if shape.width * shape.height < slide_area * area_ratio:
                continue
            tf = getattr(shape, "text_frame", None)
            if tf is not None:
                t = (tf.text or "").strip()
                if t:
                    continue
            _remove_shape_safely(shape)
        except Exception:
            continue


def _remove_large_background_pictures(slide, prs: Presentation, cover_ratio: float = 0.08):
    """
    Rimuove immagini bitmap grandi sullo slide (stock / foto di sfondo).
    Soglia più bassa per catturare anche icone-area grandi nel template.
    """
    slide_area = float(prs.slide_width * prs.slide_height)
    if slide_area <= 0:
        return
    for shape in _flatten_shapes(slide):
        try:
            if shape.shape_type not in (MSO_SHAPE_TYPE.PICTURE, MSO_SHAPE_TYPE.LINKED_PICTURE):
                continue
            if shape.width * shape.height < slide_area * cover_ratio:
                continue
            _remove_shape_safely(shape)
        except Exception:
            continue


def _strip_template_visual_noise(slide, prs: Presentation):
    """Ordine: placeholder immagine → ovali decorativi → bitmap grandi → poi sfondo solido (chiamato fuori)."""
    _remove_picture_and_media_placeholders(slide)
    _remove_large_decorative_ovals(slide, prs)
    _remove_large_background_pictures(slide, prs)


def _style_title_shape(shape, text: str, color_rgb: RGBColor, font_title: str | None, size_pt: int = 30):
    if not getattr(shape, "text_frame", None):
        return
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text or ""
    p.font.bold = True
    p.font.size = Pt(size_pt)
    p.font.color.rgb = color_rgb
    if font_title:
        p.font.name = font_title


def _normalize_slide_type(raw: str | None) -> str:
    s = (raw or "text").lower().strip()
    allowed = frozenset({"text", "bullets", "section", "quote", "split", "numbered"})
    if s in allowed:
        return s
    if s in ("bullet", "list"):
        return "bullets"
    return "text"


def _split_content_two_columns(content) -> tuple[str, str] | None:
    """Per type split: due stringhe affiancate."""
    if isinstance(content, list) and len(content) >= 2:
        return str(content[0]).strip(), str(content[1]).strip()
    if isinstance(content, dict):
        a = content.get("left") or content.get("a") or content.get("sinistra")
        b = content.get("right") or content.get("b") or content.get("destra")
        if a is not None and b is not None:
            return str(a).strip(), str(b).strip()
    return None


def _fill_body_paragraphs(
    tf,
    lines: list[str],
    *,
    text_rgb: RGBColor,
    font_body: str | None,
    body_pt: int = 18,
    bullet: bool = False,
    numbered: bool = False,
):
    """Riempie il text frame con paragrafi, word wrap e (opz.) elenco puntato o numerato."""
    tf.clear()
    tf.word_wrap = True
    try:
        tf.margin_left = Pt(4)
        tf.margin_right = Pt(8)
        tf.margin_top = Pt(2)
        tf.margin_bottom = Pt(4)
    except Exception:
        pass
    try:
        tf.auto_size = MSO_AUTO_SIZE.NONE
    except Exception:
        pass
    clean_lines = [x.strip() for x in lines if (x or "").strip()]
    first = True
    for i, line in enumerate(clean_lines):
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        if numbered:
            p.text = f"{i + 1}. {line}"
        elif bullet:
            p.text = f"• {line}"
        else:
            p.text = line
        p.level = 0
        p.font.size = Pt(body_pt)
        p.font.color.rgb = text_rgb
        if font_body:
            p.font.name = font_body
        try:
            p.space_after = Pt(6)
            p.line_spacing = 1.15
        except Exception:
            pass


def _fill_body_plain(tf, text: str, text_rgb: RGBColor, font_body: str | None, body_pt: int = 19):
    """Testo lungo: spezza su righe vuote per paragrafi multipli."""
    raw = str(text or "").replace("\r\n", "\n")
    if "\n\n" in raw:
        lines = [p.strip() for p in raw.split("\n\n") if p.strip()]
    else:
        lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
    if not lines:
        lines = [raw] if raw else [""]
    _fill_body_paragraphs(tf, lines, text_rgb=text_rgb, font_body=font_body, body_pt=body_pt, bullet=False)

def _generate_ppt_with_template(data: dict, user_tier: str, template_path: Path) -> str:
    prs = Presentation(str(template_path))
    # Le slide di esempio nel file template non vengono riutilizzate: si svuota il deck e si creano
    # solo slide dai layout master. Eventuali pagine superflue nel .pptx originale non compaiono in output.
    if len(prs.slides) > 0:
        _clear_all_slides(prs)

    theme = _theme_dict(data)
    bg_rgb = _theme_rgb(theme, "bg_color", "0a0a0a")
    slide_bg_rgb = _theme_rgb(theme, "slide_bg_color", "111111")
    accent_rgb = _theme_rgb(theme, "accent_color", "00D4FF")
    text_rgb = _theme_rgb(theme, "text_color", "FFFFFF")
    subtitle_rgb = _theme_rgb(theme, "subtitle_color", "A0A0B0")
    font_title = (theme.get("font_title") or "").strip() or None
    font_body = (theme.get("font_body") or "").strip() or None

    # layout fallback robusto
    title_layout = prs.slide_layouts[0] if len(prs.slide_layouts) > 0 else prs.slide_layouts[6]
    content_layout = prs.slide_layouts[1] if len(prs.slide_layouts) > 1 else prs.slide_layouts[6]
    blank_layout = prs.slide_layouts[6] if len(prs.slide_layouts) > 6 else prs.slide_layouts[0]

    def add_watermark(slide):
        if user_tier not in ("free", "starter"):
            return
        tx = slide.shapes.add_textbox(Inches(0.35), Inches(7.05), Inches(3.2), Inches(0.4))
        tf = tx.text_frame
        tf.clear()
        p = tf.paragraphs[0]
        p.text = "made with VoiceMint"
        p.font.size = Pt(9)
        p.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
        if font_body:
            p.font.name = font_body

    deck_mode = (data.get("deck_mode") or "presentation").strip().lower()

    def polish_slide(slide, bg: RGBColor):
        # Studio: solo testo — rimuovi riquadri immagine stock e uniforma sfondo al tema.
        # Presentazione: conserva placeholder foto e grafica del template per l’utente.
        if deck_mode == "study":
            _strip_template_visual_noise(slide, prs)
            _apply_slide_background_solid(slide, bg)
        else:
            pass

    # title
    s0 = prs.slides.add_slide(title_layout)
    polish_slide(s0, bg_rgb)
    if getattr(s0.shapes, "title", None):
        _style_title_shape(s0.shapes.title, data.get("title") or "Presentazione", text_rgb, font_title, 32)
    else:
        t = s0.shapes.add_textbox(Inches(0.9), Inches(1.2), Inches(11.5), Inches(1.4))
        _style_title_shape(t, data.get("title") or "Presentazione", text_rgb, font_title, 32)
    body0 = _first_body_placeholder(s0)
    if body0:
        _fill_body_plain(body0.text_frame, data.get("subtitle") or "", subtitle_rgb, font_body, 17)
    else:
        b = s0.shapes.add_textbox(Inches(1.1), Inches(2.7), Inches(11.0), Inches(1.5))
        _fill_body_plain(b.text_frame, data.get("subtitle") or "", subtitle_rgb, font_body, 17)
    add_watermark(s0)

    def _default_title_and_body(s, title: str):
        if getattr(s.shapes, "title", None):
            _style_title_shape(s.shapes.title, title, accent_rgb, font_title, 26)
        else:
            tb = s.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.7))
            _style_title_shape(tb, title, accent_rgb, font_title, 26)
        return _first_body_placeholder(s)

    for slide in data.get("slides", []):
        st = _normalize_slide_type(slide.get("type"))
        title = slide.get("title") or ""
        content = slide.get("content")

        if st in ("section", "quote", "split"):
            layout = blank_layout
        elif st in ("text", "bullets", "numbered"):
            layout = content_layout
        else:
            layout = blank_layout

        s = prs.slides.add_slide(layout)
        polish_slide(s, slide_bg_rgb)

        if st == "section":
            bar = s.shapes.add_shape(
                MSO_SHAPE.RECTANGLE,
                Inches(0.75),
                Inches(2.05),
                Inches(2.8),
                Inches(0.09),
            )
            bar.fill.solid()
            bar.fill.fore_color.rgb = accent_rgb
            bar.line.width = Pt(0)
            tit = s.shapes.add_textbox(Inches(0.75), Inches(2.25), Inches(11.8), Inches(1.35))
            ttf = tit.text_frame
            ttf.clear()
            tp = ttf.paragraphs[0]
            tp.text = title or "Sezione"
            tp.font.bold = True
            tp.font.size = Pt(34)
            tp.font.color.rgb = text_rgb
            if font_title:
                tp.font.name = font_title
            sub = str(content or "").strip()
            if sub:
                stb = s.shapes.add_textbox(Inches(0.75), Inches(3.75), Inches(11.5), Inches(1.1))
                _fill_body_plain(stb.text_frame, sub, subtitle_rgb, font_body, 18)

        elif st == "quote":
            if title:
                hdr = s.shapes.add_textbox(Inches(0.75), Inches(0.45), Inches(11.5), Inches(0.55))
                _style_title_shape(hdr, title, accent_rgb, font_title, 22)
            qtxt = str(content or "").strip() or "—"
            qbox = s.shapes.add_textbox(Inches(1.0), Inches(1.55), Inches(11.3), Inches(5.75))
            qtf = qbox.text_frame
            qtf.clear()
            qp = qtf.paragraphs[0]
            qp.text = f"“{qtxt}”"
            qp.font.size = Pt(18)
            qp.font.italic = True
            qp.font.color.rgb = text_rgb
            qp.alignment = PP_ALIGN.CENTER
            if font_body:
                qp.font.name = font_body
            qline = s.shapes.add_shape(
                MSO_SHAPE.RECTANGLE,
                Inches(5.4),
                Inches(6.35),
                Inches(2.5),
                Inches(0.06),
            )
            qline.fill.solid()
            qline.fill.fore_color.rgb = accent_rgb
            qline.line.width = Pt(0)

        elif st == "split":
            pair = _split_content_two_columns(content)
            body = _default_title_and_body(s, title)
            if pair:
                left, right = pair
                vbar = s.shapes.add_shape(
                    MSO_SHAPE.RECTANGLE,
                    Inches(6.58),
                    Inches(1.35),
                    Inches(0.05),
                    Inches(6.25),
                )
                vbar.fill.solid()
                vbar.fill.fore_color.rgb = accent_rgb
                vbar.line.width = Pt(0)
                lb = s.shapes.add_textbox(Inches(0.65), Inches(1.35), Inches(5.75), Inches(6.25))
                _fill_body_plain(lb.text_frame, left, text_rgb, font_body, 16)
                rb = s.shapes.add_textbox(Inches(6.78), Inches(1.35), Inches(5.85), Inches(6.25))
                _fill_body_plain(rb.text_frame, right, text_rgb, font_body, 16)
            else:
                text = str(content or "")
                if body:
                    _fill_body_plain(body.text_frame, text, text_rgb, font_body, 19)
                else:
                    box = s.shapes.add_textbox(Inches(1.0), Inches(1.45), Inches(11.0), Inches(6.05))
                    _fill_body_plain(box.text_frame, text, text_rgb, font_body, 19)

        elif st == "numbered":
            items = content if isinstance(content, list) else [str(content or "")]
            items = [str(x).strip() for x in items if str(x).strip()]
            body = _default_title_and_body(s, title)
            if body:
                _fill_body_paragraphs(
                    body.text_frame,
                    items,
                    text_rgb=text_rgb,
                    font_body=font_body,
                    body_pt=17 if len(items) > 8 else 18,
                    numbered=True,
                )
            else:
                box = s.shapes.add_textbox(Inches(1.0), Inches(1.45), Inches(11.0), Inches(6.05))
                _fill_body_paragraphs(
                    box.text_frame,
                    items,
                    text_rgb=text_rgb,
                    font_body=font_body,
                    body_pt=17 if len(items) > 8 else 18,
                    numbered=True,
                )

        elif st == "bullets":
            items = content if isinstance(content, list) else [str(content or "")]
            items = [str(x).strip() for x in items if str(x).strip()]
            body = _default_title_and_body(s, title)
            if body:
                _fill_body_paragraphs(
                    body.text_frame,
                    items,
                    text_rgb=text_rgb,
                    font_body=font_body,
                    body_pt=17 if len(items) > 8 else 18,
                    bullet=True,
                )
            else:
                box = s.shapes.add_textbox(Inches(1.0), Inches(1.45), Inches(11.0), Inches(6.05))
                _fill_body_paragraphs(
                    box.text_frame,
                    items,
                    text_rgb=text_rgb,
                    font_body=font_body,
                    body_pt=17 if len(items) > 8 else 18,
                    bullet=True,
                )

        else:
            text = str(content or "")
            body = _default_title_and_body(s, title)
            if body:
                _fill_body_plain(body.text_frame, text, text_rgb, font_body, 19)
            else:
                box = s.shapes.add_textbox(Inches(1.0), Inches(1.45), Inches(11.0), Inches(6.05))
                _fill_body_plain(box.text_frame, text, text_rgb, font_body, 19)

        add_watermark(s)

    # summary
    ss = prs.slides.add_slide(content_layout)
    polish_slide(ss, slide_bg_rgb)
    summary_title = data.get("summary_title", "Riepilogo")
    summary_text = data.get("summary", "")
    if getattr(ss.shapes, "title", None):
        _style_title_shape(ss.shapes.title, summary_title, accent_rgb, font_title, 26)
    body_s = _first_body_placeholder(ss)
    if body_s:
        _fill_body_plain(body_s.text_frame, str(summary_text or ""), text_rgb, font_body, 19)
    else:
        box = ss.shapes.add_textbox(Inches(1.0), Inches(1.45), Inches(11.0), Inches(6.05))
        _fill_body_plain(box.text_frame, str(summary_text or ""), text_rgb, font_body, 19)
    add_watermark(ss)

    filename = f"{OUTPUT_DIR}/{uuid.uuid4()}.pptx"
    prs.save(filename)
    return filename

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip("#")
    return RGBColor(int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16))

def render_html_to_image(html: str, output_path: str, width: int = 1280, height: int = 720):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=3
        )
        page = context.new_page()
        page.set_content(html, wait_until="domcontentloaded")
        page.wait_for_timeout(300)
        page.screenshot(path=output_path, full_page=False, omit_background=False)
        browser.close()

def generate_slide_html(title: str, content, theme: dict, slide_type: str = "content") -> str:
    bg = "#" + theme.get("bg_color", "0a0a0a")
    slide_bg = "#" + theme.get("slide_bg_color", "111111")
    accent = "#" + theme.get("accent_color", "00D4FF")
    text_color = "#" + theme.get("text_color", "FFFFFF")
    subtitle_color = "#" + theme.get("subtitle_color", "A0A0B0")

    if slide_type == "title":
        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{
    width:1280px; height:720px; overflow:hidden;
    background: linear-gradient(135deg, {bg} 0%, {slide_bg} 100%);
    font-family: {FONT};
    display:flex; align-items:center; justify-content:center;
    position: relative;
}}
.container {{ padding: 80px; width: 100%; }}
.tag {{ font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: {accent}; margin-bottom: 24px; font-weight: 600; }}
h1 {{ font-size: 64px; font-weight: 800; color: {text_color}; line-height: 1.1; margin-bottom: 24px; max-width: 900px; }}
.subtitle {{ font-size: 22px; color: {subtitle_color}; max-width: 700px; line-height: 1.6; }}
.accent-bar {{ width: 60px; height: 5px; background: {accent}; border-radius: 3px; margin-bottom: 32px; }}
.corner-decoration {{ position: absolute; bottom: 0; right: 0; width: 300px; height: 300px; background: radial-gradient(circle, {accent}22 0%, transparent 70%); }}
</style>
</head>
<body>
<div class="container">
    <div class="tag">Presentazione</div>
    <div class="accent-bar"></div>
    <h1>{title}</h1>
    <p class="subtitle">{content}</p>
</div>
<div class="corner-decoration"></div>
</body>
</html>"""

    elif slide_type == "bullets":
        items = content if isinstance(content, list) else [content]
        bullets_html = ""
        for i, item in enumerate(items):
            bullets_html += f'<div class="bullet-item"><div class="bullet-number">{str(i+1).zfill(2)}</div><div class="bullet-text">{item}</div></div>'

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:1280px; height:720px; overflow:hidden; background: {bg}; font-family: {FONT}; }}
.header {{ background: linear-gradient(90deg, {slide_bg}, {bg}); padding: 32px 64px; border-bottom: 2px solid {accent}44; display: flex; align-items: center; gap: 20px; }}
.header-dot {{ width: 10px; height: 10px; background: {accent}; border-radius: 50%; }}
h2 {{ font-size: 28px; font-weight: 700; color: {accent}; letter-spacing: 1px; }}
.content {{ padding: 32px 64px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }}
.bullet-item {{ background: {slide_bg}; border: 1px solid {accent}22; border-radius: 12px; padding: 20px 24px; display: flex; align-items: flex-start; gap: 16px; }}
.bullet-number {{ font-size: 11px; font-weight: 800; color: {accent}; letter-spacing: 2px; min-width: 28px; padding-top: 2px; }}
.bullet-text {{ font-size: 16px; color: {text_color}; line-height: 1.5; }}
</style>
</head>
<body>
<div class="header"><div class="header-dot"></div><h2>{title}</h2></div>
<div class="content">{bullets_html}</div>
</body>
</html>"""

    elif slide_type == "text":
        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:1280px; height:720px; overflow:hidden; background: {bg}; font-family: {FONT}; display: flex; flex-direction: column; }}
.header {{ background: linear-gradient(90deg, {slide_bg}, {bg}); padding: 32px 64px; border-bottom: 2px solid {accent}44; display: flex; align-items: center; gap: 20px; }}
.header-dot {{ width: 10px; height: 10px; background: {accent}; border-radius: 50%; }}
h2 {{ font-size: 28px; font-weight: 700; color: {accent}; letter-spacing: 1px; }}
.content {{ flex: 1; padding: 48px 64px; display: flex; align-items: center; }}
.text-body {{ font-size: 20px; color: {text_color}; line-height: 1.8; max-width: 1000px; border-left: 3px solid {accent}66; padding-left: 32px; }}
</style>
</head>
<body>
<div class="header"><div class="header-dot"></div><h2>{title}</h2></div>
<div class="content"><p class="text-body">{content}</p></div>
</body>
</html>"""

    elif slide_type == "summary":
        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:1280px; height:720px; overflow:hidden; background: linear-gradient(135deg, {bg} 0%, {slide_bg} 100%); font-family: {FONT}; display: flex; align-items: center; justify-content: center; }}
.container {{ max-width: 900px; padding: 80px; text-align: center; }}
.label {{ font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: {accent}; margin-bottom: 32px; font-weight: 600; }}
.quote-mark {{ font-size: 80px; color: {accent}44; line-height: 0.5; margin-bottom: 24px; font-family: Georgia, serif; }}
.summary-text {{ font-size: 22px; color: {text_color}; line-height: 1.8; font-weight: 400; }}
.accent-line {{ width: 40px; height: 3px; background: {accent}; border-radius: 2px; margin: 32px auto 0; }}
</style>
</head>
<body>
<div class="container">
    <div class="label">Riepilogo</div>
    <div class="quote-mark">"</div>
    <p class="summary-text">{content}</p>
    <div class="accent-line"></div>
</div>
</body>
</html>"""

    return ""


def generate_ppt(data: dict, user_tier: str = "free") -> str:
    template_path = _pick_template(data)
    if template_path is not None:
        try:
            return _generate_ppt_with_template(data, user_tier=user_tier, template_path=template_path)
        except Exception as e:
            # fallback robusto al renderer classico se un template specifico non è compatibile
            print(f"template fallback ({template_path.name}): {e}")

    theme = data.get("theme", {}) or {}

    # Theme colors: input viene da nlp_parser come stringhe hex senza '#'
    bg_color = "#" + theme.get("bg_color", "0a0a0a")
    slide_bg_color = "#" + theme.get("slide_bg_color", "111111")
    accent_color = "#" + theme.get("accent_color", "00D4FF")
    text_color = "#" + theme.get("text_color", "FFFFFF")
    subtitle_color = "#" + theme.get("subtitle_color", "A0A0B0")
    font_title = theme.get("font_title", "Inter")
    font_body = theme.get("font_body", "Inter")

    bg_rgb = hex_to_rgb(bg_color)
    slide_bg_rgb = hex_to_rgb(slide_bg_color)
    accent_rgb = hex_to_rgb(accent_color)
    text_rgb = hex_to_rgb(text_color)
    subtitle_rgb = hex_to_rgb(subtitle_color)

    def set_slide_background(slide, rgb):
        # Background solido: scuro e coerente con theme
        fill = slide.background.fill
        fill.solid()
        fill.fore_color.rgb = rgb

    def add_watermark(slide):
        # Watermark for free trial and Starter; no watermark for Professional, Enterprise, legacy "pro"
        if user_tier not in ("free", "starter"):
            return
        tx = slide.shapes.add_textbox(Inches(0.35), Inches(7.05), Inches(3.2), Inches(0.4))
        tf = tx.text_frame
        tf.clear()
        p = tf.paragraphs[0]
        p.text = "made with VoiceMint"
        p.font.size = Pt(9)
        p.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
        p.font.name = font_body

    def add_centered_text(slide, text, x, y, w, h, size, color, bold=False, font_name=None):
        box = slide.shapes.add_textbox(x, y, w, h)
        tf = box.text_frame
        tf.clear()
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = size
        p.font.bold = bold
        p.font.color.rgb = color
        p.font.name = font_name or font_body
        p.alignment = PP_ALIGN.CENTER
        return box

    prs = Presentation()
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    # layout variant deterministica per avere deck diversi tra argomenti
    variant_seed = (data.get("title") or "") + "|" + (data.get("subtitle") or "")
    variant = int(hashlib.sha256(variant_seed.encode("utf-8")).hexdigest(), 16) % 3

    slide_configs = [("title", data.get("title", ""), data.get("subtitle", ""))]
    for slide in data.get("slides", []):
        slide_configs.append(
            (_normalize_slide_type(slide.get("type")), slide.get("title", ""), slide.get("content"))
        )
    slide_configs.append(("summary", data.get("summary_title", "Riepilogo"), data.get("summary", "")))

    for slide_type, title, content in slide_configs:
        slide = prs.slides.add_slide(blank_layout)
        set_slide_background(slide, bg_rgb if slide_type == "title" else slide_bg_rgb)

        if slide_type == "title":
            # Accent bar
            accent_bar = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE,
                Inches(2.0),
                Inches(2.35),
                Inches(1.6),
                Inches(0.06),
            )
            accent_bar.fill.solid()
            accent_bar.fill.fore_color.rgb = accent_rgb

            add_centered_text(
                slide,
                title,
                Inches(0.8),
                Inches(1.45),
                Inches(11.7),
                Inches(1.5),
                Pt(44),
                text_rgb,
                bold=True,
                font_name=font_title,
            )
            add_centered_text(
                slide,
                content or "",
                Inches(2.0),
                Inches(2.85),
                Inches(9.3),
                Inches(0.9),
                Pt(20),
                subtitle_rgb,
                bold=False,
                font_name=font_body,
            )

        elif slide_type == "section":
            bar = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE,
                Inches(0.75),
                Inches(2.05),
                Inches(2.8),
                Inches(0.09),
            )
            bar.fill.solid()
            bar.fill.fore_color.rgb = accent_rgb
            bar.line.width = Pt(0)
            tbox = slide.shapes.add_textbox(Inches(0.75), Inches(2.25), Inches(11.8), Inches(1.35))
            tf = tbox.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = title or "Sezione"
            p.font.bold = True
            p.font.size = Pt(34)
            p.font.color.rgb = text_rgb
            p.font.name = font_title
            sub = str(content or "").strip()
            if sub:
                sbox = slide.shapes.add_textbox(Inches(0.75), Inches(3.75), Inches(11.5), Inches(1.1))
                _fill_body_plain(sbox.text_frame, sub, subtitle_rgb, font_body, 18)

        elif slide_type == "quote":
            if title:
                hdr = slide.shapes.add_textbox(Inches(0.75), Inches(0.45), Inches(11.5), Inches(0.55))
                tf = hdr.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = title
                p.font.bold = True
                p.font.size = Pt(22)
                p.font.color.rgb = accent_rgb
                p.font.name = font_title
            qtxt = str(content or "").strip() or "—"
            qbox = slide.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(11.3), Inches(4.6))
            qtf = qbox.text_frame
            qtf.clear()
            qp = qtf.paragraphs[0]
            qp.text = f"“{qtxt}”"
            qp.font.size = Pt(21)
            qp.font.italic = True
            qp.font.color.rgb = text_rgb
            qp.alignment = PP_ALIGN.CENTER
            qp.font.name = font_body
            qline = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE,
                Inches(5.4),
                Inches(6.35),
                Inches(2.5),
                Inches(0.06),
            )
            qline.fill.solid()
            qline.fill.fore_color.rgb = accent_rgb
            qline.line.width = Pt(0)

        elif slide_type == "split":
            pair = _split_content_two_columns(content)
            title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.6))
            tf = title_box.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = title or ""
            p.font.size = Pt(26)
            p.font.bold = True
            p.font.color.rgb = accent_rgb
            p.font.name = font_title
            p.alignment = PP_ALIGN.LEFT
            if pair:
                left, right = pair
                vbar = slide.shapes.add_shape(
                    MSO_SHAPE.RECTANGLE,
                    Inches(6.58),
                    Inches(1.35),
                    Inches(0.05),
                    Inches(5.85),
                )
                vbar.fill.solid()
                vbar.fill.fore_color.rgb = accent_rgb
                vbar.line.width = Pt(0)
                lb = slide.shapes.add_textbox(Inches(0.65), Inches(1.35), Inches(5.75), Inches(5.85))
                _fill_body_plain(lb.text_frame, left, text_rgb, font_body, 17)
                rb = slide.shapes.add_textbox(Inches(6.78), Inches(1.35), Inches(5.85), Inches(5.85))
                _fill_body_plain(rb.text_frame, right, text_rgb, font_body, 17)
            else:
                body_box = slide.shapes.add_textbox(Inches(1.15), Inches(1.5), Inches(11.9), Inches(5.8))
                _fill_body_plain(body_box.text_frame, str(content or ""), text_rgb, font_body, 19)

        elif slide_type == "numbered":
            bullets = content if isinstance(content, list) else [str(content)]
            bullets = [str(b).strip() for b in bullets if str(b).strip()]
            title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.6))
            tf = title_box.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = title or ""
            p.font.size = Pt(26)
            p.font.bold = True
            p.font.color.rgb = accent_rgb
            p.font.name = font_title
            p.alignment = PP_ALIGN.LEFT
            n = len(bullets)
            columns = 2 if n >= 8 else 1
            top_y = 1.35
            left_margin = 0.95 if variant == 1 else 0.85
            col_gap = 0.55
            col_w = (13.33 - left_margin - 0.75 - (col_gap if columns == 2 else 0)) / columns
            row_h = 0.55 if n <= 8 else 0.48
            for idx, bullet in enumerate(bullets[:12]):
                col = 0 if columns == 1 else (idx // 6)
                row = idx if columns == 1 else (idx % 6)
                x = left_margin + col * (col_w + (col_gap if columns == 2 else 0))
                y = top_y + row * row_h
                num_box = slide.shapes.add_textbox(Inches(x), Inches(y + 0.02), Inches(0.35), Inches(0.35))
                ntf = num_box.text_frame
                ntf.clear()
                np = ntf.paragraphs[0]
                np.text = f"{idx + 1}."
                np.font.size = Pt(14)
                np.font.bold = True
                np.font.color.rgb = accent_rgb
                np.font.name = font_body
                box = slide.shapes.add_textbox(Inches(x + 0.38), Inches(y), Inches(col_w - 0.4), Inches(row_h))
                btf = box.text_frame
                btf.clear()
                btf.word_wrap = True
                bp = btf.paragraphs[0]
                bp.text = str(bullet)
                bp.font.size = Pt(18 if n <= 6 else 16)
                bp.font.color.rgb = text_rgb
                bp.font.name = font_body
                bp.alignment = PP_ALIGN.LEFT

        elif slide_type == "bullets":
            bullets = content if isinstance(content, list) else [str(content)]
            bullets = [str(b).strip() for b in bullets if str(b).strip()]

            # Slide title (con piccola variazione stile)
            title_x = 0.8 if variant != 2 else 1.1
            title_box = slide.shapes.add_textbox(Inches(title_x), Inches(0.5), Inches(11.7), Inches(0.6))
            tf = title_box.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = title or ""
            p.font.size = Pt(26)
            p.font.bold = True
            p.font.color.rgb = accent_rgb
            p.font.name = font_title
            p.alignment = PP_ALIGN.LEFT

            # Layout bullets: lista pulita (niente card giganti)
            n = len(bullets)
            columns = 2 if n >= 8 else 1
            top_y = 1.35
            left_margin = 0.95 if variant == 1 else 0.85
            col_gap = 0.55
            col_w = (13.33 - left_margin - 0.75 - (col_gap if columns == 2 else 0)) / columns
            row_h = 0.55 if n <= 8 else 0.48

            for idx, bullet in enumerate(bullets[:12]):
                col = 0 if columns == 1 else (idx // 6)
                row = idx if columns == 1 else (idx % 6)
                x = left_margin + col * (col_w + (col_gap if columns == 2 else 0))
                y = top_y + row * row_h

                # accent dot / number
                dot = slide.shapes.add_shape(
                    MSO_SHAPE.OVAL,
                    Inches(x),
                    Inches(y + 0.07),
                    Inches(0.16),
                    Inches(0.16),
                )
                dot.fill.solid()
                dot.fill.fore_color.rgb = accent_rgb
                dot.line.color.rgb = accent_rgb

                box = slide.shapes.add_textbox(Inches(x + 0.28), Inches(y), Inches(col_w - 0.25), Inches(row_h))
                tf = box.text_frame
                tf.clear()
                tf.word_wrap = True
                p = tf.paragraphs[0]
                p.text = str(bullet)
                p.font.size = Pt(18 if n <= 6 else 16)
                p.font.color.rgb = text_rgb
                p.font.name = font_body
                p.alignment = PP_ALIGN.LEFT

        elif slide_type == "text":
            # Title at top
            title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.6))
            tf = title_box.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = title or ""
            p.font.size = Pt(26)
            p.font.bold = True
            p.font.color.rgb = accent_rgb
            p.font.name = font_title
            p.alignment = PP_ALIGN.LEFT

            # Left accent border effect
            border = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE,
                Inches(0.95),
                Inches(1.35),
                Inches(0.06),
                Inches(5.8),
            )
            border.fill.solid()
            border.fill.fore_color.rgb = accent_rgb
            border.line.color.rgb = accent_rgb
            border.line.width = Pt(0.0)

            body_box = slide.shapes.add_textbox(Inches(1.15), Inches(1.35), Inches(11.9), Inches(5.8))
            tf = body_box.text_frame
            tf.clear()
            tf.word_wrap = True
            tf.auto_size = None

            # Keep it readable (wrap by slide width)
            p = tf.paragraphs[0]
            p.text = str(content or "")
            p.font.size = Pt(20)
            p.font.color.rgb = text_rgb
            p.font.name = font_body
            p.alignment = PP_ALIGN.LEFT

        elif slide_type == "summary":
            # Accent line
            # Quote text (centered)
            summary_text = str(content or "")

            add_centered_text(
                slide,
                f"“{summary_text}”",
                Inches(1.0),
                Inches(2.4),
                Inches(11.3),
                Inches(3.0),
                Pt(24),
                text_rgb,
                bold=False,
                font_name=font_body,
            )

            line = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE,
                Inches(5.35),
                Inches(5.25),
                Inches(2.6),
                Inches(0.05),
            )
            line.fill.solid()
            line.fill.fore_color.rgb = accent_rgb
            line.line.color.rgb = accent_rgb
            line.line.width = Pt(0.0)

        else:
            # Fallback: treat as text slide
            title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.6))
            tf = title_box.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = title or ""
            p.font.size = Pt(26)
            p.font.bold = True
            p.font.color.rgb = accent_rgb
            p.font.name = font_title
            p.alignment = PP_ALIGN.LEFT

            body_box = slide.shapes.add_textbox(Inches(1.15), Inches(1.5), Inches(11.9), Inches(5.8))
            tf = body_box.text_frame
            tf.clear()
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = str(content or "")
            p.font.size = Pt(20)
            p.font.color.rgb = text_rgb
            p.font.name = font_body
            p.alignment = PP_ALIGN.LEFT

        add_watermark(slide)

    filename = f"{OUTPUT_DIR}/{uuid.uuid4()}.pptx"
    prs.save(filename)
    return filename
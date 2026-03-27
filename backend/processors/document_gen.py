import os
import uuid
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from playwright.sync_api import sync_playwright
import math
import hashlib

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"

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
        slide_configs.append((slide.get("type"), slide.get("title", ""), slide.get("content")))
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
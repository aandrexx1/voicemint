import os
import uuid
import asyncio
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from playwright.sync_api import sync_playwright

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip("#")
    return RGBColor(int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16))

def render_html_to_image(html: str, output_path: str, width: int = 1280, height: int = 720):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height})
        page.set_content(html)
        page.wait_for_timeout(500)
        page.screenshot(path=output_path, full_page=False)
        browser.close()

def generate_slide_html(title: str, content: str, theme: dict, slide_type: str = "content") -> str:
    bg = "#" + theme.get("bg_color", "0a0a0a")
    slide_bg = "#" + theme.get("slide_bg_color", "111111")
    accent = "#" + theme.get("accent_color", "00D4FF")
    text = "#" + theme.get("text_color", "FFFFFF")
    subtitle_color = "#" + theme.get("subtitle_color", "A0A0B0")
    font = theme.get("font_title", "Inter")

    google_font = f"https://fonts.googleapis.com/css2?family={font.replace(' ', '+')}:wght@400;600;700;800&display=swap"

    if slide_type == "title":
        return f"""<!DOCTYPE html>
<html>
<head>
<link href="{google_font}" rel="stylesheet">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{
    width:1280px; height:720px; overflow:hidden;
    background: linear-gradient(135deg, {bg} 0%, {slide_bg} 100%);
    font-family: '{font}', 'Segoe UI', sans-serif;
    display:flex; align-items:center; justify-content:center;
}}
.container {{
    padding: 80px;
    width: 100%;
}}
.tag {{
    font-size: 13px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 24px;
    font-weight: 600;
}}
h1 {{
    font-size: 64px;
    font-weight: 800;
    color: {text};
    line-height: 1.1;
    margin-bottom: 24px;
    max-width: 900px;
}}
.subtitle {{
    font-size: 22px;
    color: {subtitle_color};
    max-width: 700px;
    line-height: 1.6;
}}
.accent-bar {{
    width: 60px;
    height: 5px;
    background: {accent};
    border-radius: 3px;
    margin-bottom: 32px;
}}
.corner-decoration {{
    position: absolute;
    bottom: 0;
    right: 0;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, {accent}22 0%, transparent 70%);
}}
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
            bullets_html += f"""
            <div class="bullet-item" style="animation-delay: {i * 0.1}s">
                <div class="bullet-number">{str(i+1).zfill(2)}</div>
                <div class="bullet-text">{item}</div>
            </div>"""

        return f"""<!DOCTYPE html>
<html>
<head>
<link href="{google_font}" rel="stylesheet">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{
    width:1280px; height:720px; overflow:hidden;
    background: {bg};
    font-family: '{font}', 'Segoe UI', sans-serif;
}}
.header {{
    background: linear-gradient(90deg, {slide_bg}, {bg});
    padding: 32px 64px;
    border-bottom: 2px solid {accent}44;
    display: flex;
    align-items: center;
    gap: 20px;
}}
.header-dot {{
    width: 10px;
    height: 10px;
    background: {accent};
    border-radius: 50%;
}}
h2 {{
    font-size: 28px;
    font-weight: 700;
    color: {accent};
    letter-spacing: 1px;
}}
.content {{
    padding: 32px 64px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}}
.bullet-item {{
    background: {slide_bg};
    border: 1px solid {accent}22;
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
}}
.bullet-number {{
    font-size: 11px;
    font-weight: 800;
    color: {accent};
    letter-spacing: 2px;
    min-width: 28px;
    padding-top: 2px;
}}
.bullet-text {{
    font-size: 16px;
    color: {text};
    line-height: 1.5;
}}
</style>
</head>
<body>
<div class="header">
    <div class="header-dot"></div>
    <h2>Punti Chiave</h2>
</div>
<div class="content">
    {bullets_html}
</div>
</body>
</html>"""

    elif slide_type == "summary":
        return f"""<!DOCTYPE html>
<html>
<head>
<link href="{google_font}" rel="stylesheet">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{
    width:1280px; height:720px; overflow:hidden;
    background: linear-gradient(135deg, {bg} 0%, {slide_bg} 100%);
    font-family: '{font}', 'Segoe UI', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
}}
.container {{
    max-width: 900px;
    padding: 80px;
    text-align: center;
}}
.label {{
    font-size: 12px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: {accent};
    margin-bottom: 32px;
    font-weight: 600;
}}
.quote-mark {{
    font-size: 80px;
    color: {accent}44;
    line-height: 0.5;
    margin-bottom: 24px;
    font-family: Georgia, serif;
}}
.summary-text {{
    font-size: 22px;
    color: {text};
    line-height: 1.8;
    font-weight: 400;
}}
.accent-line {{
    width: 40px;
    height: 3px;
    background: {accent};
    border-radius: 2px;
    margin: 32px auto 0;
}}
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
    theme = data.get("theme", {})

    slide_configs = [("title", data["title"], data["subtitle"])]
    
    for slide in data.get("slides", []):
        slide_configs.append((slide["type"], slide["title"], slide["content"]))
    
    slide_configs.append(("summary", "Riepilogo", data["summary"]))

    image_paths = []
    for slide_type, title, content in slide_configs:
        html = generate_slide_html(title, content, theme, slide_type)
        img_path = f"{OUTPUT_DIR}/{uuid.uuid4()}.png"
        render_html_to_image(html, img_path)
        image_paths.append(img_path)

    prs = Presentation()
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    for i, img_path in enumerate(image_paths):
        slide = prs.slides.add_slide(blank_layout)
        slide.shapes.add_picture(img_path, Inches(0), Inches(0), prs.slide_width, prs.slide_height)

        if user_tier == "free":
            txBox = slide.shapes.add_textbox(Inches(0.15), Inches(7.25), Inches(3), Inches(0.25))
            tf = txBox.text_frame
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = "made with VoiceMint"
            run.font.size = Pt(7)
            run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    filename = f"{OUTPUT_DIR}/{uuid.uuid4()}.pptx"
    prs.save(filename)

    for img_path in image_paths:
        try:
            os.remove(img_path)
        except:
            pass

    return filename


def generate_pdf(data: dict, user_tier: str = "free") -> str:
    from PIL import Image as PILImage

    theme = data.get("theme", {})

    slide_configs = [("title", data["title"], data["subtitle"])]
    for slide in data.get("slides", []):
        slide_configs.append((slide["type"], slide["title"], slide["content"]))
    slide_configs.append(("summary", "Riepilogo", data["summary"]))

    image_paths = []
    for slide_type, title, content in slide_configs:
        html = generate_slide_html(title, content, theme, slide_type)
        img_path = f"{OUTPUT_DIR}/{uuid.uuid4()}.png"
        render_html_to_image(html, img_path)
        image_paths.append(img_path)

    filename = f"{OUTPUT_DIR}/{uuid.uuid4()}.pdf"

    images = []
    for img_path in image_paths:
        img = PILImage.open(img_path).convert("RGB")
        images.append(img)

    if images:
        images[0].save(
            filename,
            save_all=True,
            append_images=images[1:],
            resolution=150
        )

    for img_path in image_paths:
        try:
            os.remove(img_path)
        except:
            pass

    return filename

def generate_html(data: dict, user_tier: str = "free") -> str:
    theme = data.get("theme", {})
    bg = "#" + theme.get("bg_color", "0a0a0a")
    slide_bg = "#" + theme.get("slide_bg_color", "111111")
    accent = "#" + theme.get("accent_color", "00D4FF")
    text = "#" + theme.get("text_color", "FFFFFF")
    subtitle_color = "#" + theme.get("subtitle_color", "A0A0B0")
    font = theme.get("font_title", "Inter")

    google_font = f"https://fonts.googleapis.com/css2?family={font.replace(' ', '+')}:wght@400;600;700;800&display=swap"
    bullets_html = "".join([f'<li>{b}</li>' for b in data["bullets"]])
    watermark = '<footer style="text-align:center;padding:20px;font-size:11px;color:#444;">made with <a href="https://voicemint.it" style="color:#666;">VoiceMint</a></footer>' if user_tier == "free" else ""

    html = f"""<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{data["title"]}</title>
    <link href="{google_font}" rel="stylesheet">
    <style>
        * {{ margin:0; padding:0; box-sizing:border-box; }}
        body {{ font-family: '{font}', 'Segoe UI', sans-serif; background:{bg}; color:{text}; }}
        nav {{
            position:fixed; top:0; width:100%;
            background:{bg}ee;
            padding:1.2rem 3rem;
            display:flex; align-items:center; justify-content:space-between;
            z-index:100;
            border-bottom: 1px solid {accent}33;
            backdrop-filter: blur(10px);
        }}
        nav .logo {{ font-weight:800; font-size:1.1rem; color:{accent}; letter-spacing:1px; }}
        nav a {{ color:{subtitle_color}; text-decoration:none; margin-left:2rem; font-size:0.9rem; transition:color 0.2s; }}
        nav a:hover {{ color:{text}; }}
        .hero {{
            min-height:100vh;
            display:flex; flex-direction:column; justify-content:center;
            padding: 8rem 4rem 4rem;
            max-width:1100px; margin:0 auto;
            position: relative;
        }}
        .hero-tag {{
            font-size:12px; letter-spacing:4px; text-transform:uppercase;
            color:{accent}; margin-bottom:24px; font-weight:600;
        }}
        .hero h1 {{
            font-size:4rem; font-weight:800; line-height:1.1;
            margin-bottom:1.5rem; max-width:800px;
        }}
        .accent-bar {{ width:50px; height:4px; background:{accent}; border-radius:2px; margin-bottom:2rem; }}
        .hero p {{ font-size:1.2rem; color:{subtitle_color}; max-width:600px; line-height:1.7; }}
        .section {{ padding:6rem 4rem; max-width:1100px; margin:0 auto; }}
        .section-label {{
            font-size:12px; letter-spacing:4px; text-transform:uppercase;
            color:{accent}; margin-bottom:40px; font-weight:600;
        }}
        .bullets-grid {{
            display:grid; grid-template-columns:1fr 1fr; gap:16px;
        }}
        .bullet-card {{
            background:{slide_bg};
            border:1px solid {accent}22;
            border-radius:12px;
            padding:24px 28px;
            display:flex; gap:20px; align-items:flex-start;
            transition: border-color 0.2s, transform 0.2s;
        }}
        .bullet-card:hover {{ border-color:{accent}66; transform:translateY(-2px); }}
        .bullet-num {{
            font-size:10px; font-weight:800; color:{accent};
            letter-spacing:2px; min-width:28px; padding-top:3px;
        }}
        .bullet-text {{ font-size:1rem; line-height:1.6; color:{text}; }}
        .summary-section {{ padding:6rem 4rem; background:{slide_bg}; }}
        .summary-inner {{ max-width:800px; margin:0 auto; text-align:center; }}
        .summary-inner .section-label {{ display:block; margin-bottom:32px; }}
        .quote {{ font-size:5rem; color:{accent}33; line-height:0.5; font-family:Georgia,serif; margin-bottom:24px; }}
        .summary-text {{ font-size:1.2rem; line-height:1.9; color:{subtitle_color}; }}
        .divider {{ border:none; border-top:1px solid {accent}11; }}
        @media(max-width:768px) {{
            .hero h1 {{ font-size:2.5rem; }}
            .bullets-grid {{ grid-template-columns:1fr; }}
            .section {{ padding:4rem 2rem; }}
            nav {{ padding:1rem 1.5rem; }}
        }}
    </style>
</head>
<body>
    <nav>
        <span class="logo">{data["title"]}</span>
        <div>
            <a href="#punti">Punti chiave</a>
            <a href="#riepilogo">Riepilogo</a>
        </div>
    </nav>
    <div class="hero">
        <div class="hero-tag">Presentazione</div>
        <div class="accent-bar"></div>
        <h1>{data["title"]}</h1>
        <p>{data["subtitle"]}</p>
    </div>
    <hr class="divider">
    <div class="section" id="punti">
        <div class="section-label">Punti Chiave</div>
        <div class="bullets-grid">
            {"".join([f'<div class="bullet-card"><div class="bullet-num">{str(i+1).zfill(2)}</div><div class="bullet-text">{b}</div></div>' for i, b in enumerate(data["bullets"])])}
        </div>
    </div>
    <hr class="divider">
    <div class="summary-section" id="riepilogo">
        <div class="summary-inner">
            <span class="section-label">Riepilogo</span>
            <div class="quote">"</div>
            <p class="summary-text">{data["summary"]}</p>
        </div>
    </div>
    {watermark}
</body>
</html>"""

    filename = f"{OUTPUT_DIR}/{uuid.uuid4()}.html"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(html)
    return filename
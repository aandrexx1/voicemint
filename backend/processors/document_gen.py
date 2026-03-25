import os
import uuid
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from playwright.sync_api import sync_playwright

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
        try: os.remove(img_path)
        except: pass
    return filename
import os
import uuid
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from jinja2 import Template

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─────────────────────────────────────────
# GENERATORE PPT
# ─────────────────────────────────────────
def generate_ppt(data: dict) -> str:
    prs = Presentation()
    
    # Slide 1 — Titolo
    slide1 = prs.slides.add_slide(prs.slide_layouts[0])
    slide1.shapes.title.text = data["title"]
    slide1.placeholders[1].text = data["subtitle"]
    
    # Colore titolo
    slide1.shapes.title.text_frame.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x1A, 0x1A, 0x2E)
    
    # Slide 2 — Punti chiave
    slide2 = prs.slides.add_slide(prs.slide_layouts[1])
    slide2.shapes.title.text = "Punti Chiave"
    
    tf = slide2.placeholders[1].text_frame
    tf.clear()
    
    for i, bullet in enumerate(data["bullets"]):
        if i == 0:
            tf.paragraphs[0].text = bullet
        else:
            p = tf.add_paragraph()
            p.text = bullet
            p.level = 0
    
    # Slide 3 — Riepilogo
    slide3 = prs.slides.add_slide(prs.slide_layouts[1])
    slide3.shapes.title.text = "Riepilogo"
    slide3.placeholders[1].text = data["summary"]
    
    filename = f"{OUTPUT_DIR}/{uuid.uuid4()}.pptx"
    prs.save(filename)
    return filename

# ─────────────────────────────────────────
# GENERATORE PDF
# ─────────────────────────────────────────
def generate_pdf(data: dict) -> str:
    filename = f"{OUTPUT_DIR}/{uuid.uuid4()}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=colors.HexColor("#1A1A2E"),
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=14,
        textColor=colors.HexColor("#16213E"),
        spaceAfter=20
    )
    
    bullet_style = ParagraphStyle(
        "CustomBullet",
        parent=styles["Normal"],
        fontSize=12,
        leftIndent=20,
        spaceAfter=8
    )
    
    story = []
    story.append(Paragraph(data["title"], title_style))
    story.append(Paragraph(data["subtitle"], subtitle_style))
    story.append(Spacer(1, 12))
    
    for bullet in data["bullets"]:
        story.append(Paragraph(f"• {bullet}", bullet_style))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph(data["summary"], styles["Normal"]))
    
    doc.build(story)
    return filename

# ─────────────────────────────────────────
# GENERATORE HTML (sito web)
# ─────────────────────────────────────────
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #fff; }
        nav { position: fixed; top: 0; width: 100%; background: rgba(15,15,26,0.95); 
              padding: 1rem 2rem; display: flex; gap: 2rem; z-index: 100; }
        nav a { color: #a78bfa; text-decoration: none; font-weight: 500; }
        nav a:hover { color: #fff; }
        .hero { min-height: 100vh; display: flex; flex-direction: column; 
                justify-content: center; align-items: center; text-align: center; padding: 2rem; }
        .hero h1 { font-size: 3rem; background: linear-gradient(135deg, #a78bfa, #60a5fa); 
                   -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; }
        .hero p { font-size: 1.2rem; color: #94a3b8; max-width: 600px; }
        .section { padding: 5rem 2rem; max-width: 800px; margin: 0 auto; }
        .section h2 { font-size: 2rem; color: #a78bfa; margin-bottom: 2rem; }
        .bullet { background: #1a1a2e; border-left: 4px solid #a78bfa; 
                  padding: 1rem 1.5rem; margin-bottom: 1rem; border-radius: 0 8px 8px 0; }
        .summary { background: #16213e; padding: 2rem; border-radius: 12px; 
                   color: #94a3b8; line-height: 1.8; }
    </style>
</head>
<body>
    <nav>
        <a href="#home">Home</a>
        {% for bullet in bullets %}<a href="#punti">Punti Chiave</a>{% break %}{% endfor %}
        <a href="#riepilogo">Riepilogo</a>
    </nav>
    
    <section class="hero" id="home">
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
    </section>
    
    <section class="section" id="punti">
        <h2>Punti Chiave</h2>
        {% for bullet in bullets %}
        <div class="bullet">{{ bullet }}</div>
        {% endfor %}
    </section>
    
    <section class="section" id="riepilogo">
        <h2>Riepilogo</h2>
        <div class="summary">{{ summary }}</div>
    </section>
</body>
</html>
"""

def generate_html(data: dict) -> str:
    template = Template(HTML_TEMPLATE)
    html = template.render(**data)
    filename = f"{OUTPUT_DIR}/{uuid.uuid4()}.html"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(html)
    return filename
from __future__ import annotations

import re
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[2]
WEB_DIR = ROOT / "web"
PUBLIC_DIR = WEB_DIR / "public"
CSS_PATH = WEB_DIR / "src" / "app" / "globals.css"
OUTPUT_PATH = ROOT / "deliverables" / "findmyroom-charte-graphique.pdf"


def parse_css_variables(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    return {
        key: value.strip()
        for key, value in re.findall(r"--([a-z0-9-]+)\s*:\s*([^;]+);", text, flags=re.IGNORECASE)
    }


def parse_color(value: str):
    value = value.strip()
    if value.startswith("#"):
        return colors.HexColor(value)
    rgba = re.match(r"rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\)", value)
    if rgba:
        r, g, b, a = rgba.groups()
        return colors.Color(int(r) / 255, int(g) / 255, int(b) / 255, alpha=float(a))
    return colors.black


def draw_section_title(pdf: canvas.Canvas, y: float, title: str, subtitle: str | None = None) -> float:
    pdf.setFont("Helvetica-Bold", 18)
    pdf.setFillColor(colors.HexColor("#1f2937"))
    pdf.drawString(40, y, title)
    if subtitle:
        y -= 18
        pdf.setFont("Helvetica", 11)
        pdf.setFillColor(colors.HexColor("#57534e"))
        pdf.drawString(40, y, subtitle)
    return y - 26


def draw_logo(pdf: canvas.Canvas, path: Path, x: float, y: float, max_width: float, max_height: float) -> None:
    image = ImageReader(str(path))
    iw, ih = image.getSize()
    scale = min(max_width / iw, max_height / ih)
    w = iw * scale
    h = ih * scale
    pdf.drawImage(image, x, y, width=w, height=h, preserveAspectRatio=True, mask="auto")


def generate() -> None:
    css_tokens = parse_css_variables(CSS_PATH)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT_PATH), pagesize=A4)
    width, height = A4

    # Page 1 - Overview + logos
    pdf.setFillColor(colors.HexColor("#f7f3eb"))
    pdf.rect(0, 0, width, height, stroke=0, fill=1)
    pdf.setFillColor(colors.HexColor("#1f2937"))
    pdf.setFont("Helvetica-Bold", 30)
    pdf.drawString(40, height - 80, "FindMyRoom")
    pdf.setFont("Helvetica", 14)
    pdf.setFillColor(colors.HexColor("#57534e"))
    pdf.drawString(40, height - 106, "Charte graphique")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, height - 122, f"Version auto-générée le {date.today().isoformat()}")

    y = draw_section_title(
        pdf,
        height - 170,
        "1. Logos officiels",
        "Sources: /web/public/*.png et *.svg (meme nomenclature)",
    )

    draw_logo(pdf, PUBLIC_DIR / "findmyrooom-logo.png", 40, y - 88, 300, 88)
    pdf.setFont("Helvetica", 9)
    pdf.setFillColor(colors.HexColor("#57534e"))
    pdf.drawString(40, y - 98, "Logo horizontal principal: findmyrooom-logo.png / .svg")

    draw_logo(pdf, PUBLIC_DIR / "logo-icon.png", 370, y - 60, 80, 80)
    pdf.drawString(360, y - 98, "Logo icone")

    pdf.setFillColor(colors.HexColor("#1f2937"))
    pdf.roundRect(40, y - 240, 220, 120, 10, stroke=0, fill=1)
    draw_logo(pdf, PUBLIC_DIR / "logo-white.png", 90, y - 210, 120, 70)
    pdf.setFillColor(colors.HexColor("#57534e"))
    pdf.drawString(40, y - 252, "Version negative (fond fonce): logo-white.png / .svg")

    draw_logo(pdf, PUBLIC_DIR / "logo.png", 300, y - 210, 90, 90)
    draw_logo(pdf, PUBLIC_DIR / "Logo-black.png", 420, y - 210, 90, 90)
    pdf.drawString(300, y - 252, "Variantes secondaires: logo.png, Logo-black.png")

    pdf.setFont("Helvetica", 10)
    pdf.setFillColor(colors.HexColor("#44403c"))
    pdf.drawString(40, 70, "Web app: SVG prioritaire pour header/favicon; PNG garde pour OG, email et fallback media.")

    pdf.showPage()

    # Page 2 - Colors
    pdf.setFillColor(colors.white)
    pdf.rect(0, 0, width, height, stroke=0, fill=1)
    y = draw_section_title(
        pdf,
        height - 60,
        "2. Palette couleurs (tokens CSS)",
        "Extrait de /web/src/app/globals.css (:root)",
    )

    token_order = [
        "background",
        "foreground",
        "surface",
        "muted",
        "brand",
        "brand-strong",
        "brand-soft",
        "brand-outline",
        "line",
    ]

    card_w = 245
    card_h = 86
    x_positions = [40, 310]
    idx = 0
    for token in token_order:
        value = css_tokens.get(token)
        if not value:
            continue
        x = x_positions[idx % 2]
        row = idx // 2
        yy = y - row * (card_h + 16)

        pdf.setStrokeColor(colors.HexColor("#e7e0d4"))
        pdf.setFillColor(colors.HexColor("#fffdf8"))
        pdf.roundRect(x, yy - card_h, card_w, card_h, 10, stroke=1, fill=1)

        swatch_h = 38
        pdf.setFillColor(parse_color(value))
        pdf.roundRect(x + 10, yy - 12 - swatch_h, 72, swatch_h, 6, stroke=0, fill=1)

        pdf.setFillColor(colors.HexColor("#1f2937"))
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(x + 92, yy - 24, f"--{token}")
        pdf.setFont("Helvetica", 10)
        pdf.setFillColor(colors.HexColor("#57534e"))
        pdf.drawString(x + 92, yy - 42, value)

        idx += 1

    pdf.setFont("Helvetica", 10)
    pdf.setFillColor(colors.HexColor("#57534e"))
    pdf.drawString(40, 90, "Base UI: background #f7f3eb, surfaces #fffdf8, accent marque #ee7768.")
    pdf.drawString(40, 74, "Outline focus: rgba(238, 119, 104, 0.42).")

    pdf.showPage()

    # Page 3 - Typography + component style
    pdf.setFillColor(colors.HexColor("#f7f3eb"))
    pdf.rect(0, 0, width, height, stroke=0, fill=1)
    y = draw_section_title(
        pdf,
        height - 60,
        "3. Typographie et UI",
        "Extrait de /web/src/app/layout.tsx et /web/src/app/globals.css",
    )

    lines = [
        "Police principale: Lato (Google Fonts) - weights 400, 700, 900.",
        "Font stack fallback: Helvetica Neue, Arial, sans-serif.",
        "Titres et texte courant utilises sur Lato (font-sans et font-serif mappes sur --font-lato).",
        "Rayon standard: 10px (inputs, boutons), 16px (cards/panels).",
        "Bouton primaire: fond #ee7768, hover #d85f51, texte blanc.",
        "Bouton ghost: fond blanc, bord #d6d3d1, hover #fee9e6.",
        "Tone of voice visuelle: chaleureux, propre, contraste doux, accent saumon corail.",
    ]

    pdf.setFont("Helvetica", 11)
    pdf.setFillColor(colors.HexColor("#1f2937"))
    step = 18
    for line in lines:
        pdf.drawString(40, y, f"- {line}")
        y -= step

    y -= 6
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, y, "Apercu typographique")
    y -= 30

    pdf.setFillColor(colors.HexColor("#1f2937"))
    pdf.setFont("Helvetica-Bold", 28)
    pdf.drawString(40, y, "Find your next room in Brussels")
    y -= 40
    pdf.setFont("Helvetica", 13)
    pdf.setFillColor(colors.HexColor("#57534e"))
    pdf.drawString(40, y, "Texte courant UI: clair, direct, sans surcharge visuelle.")

    y -= 55
    pdf.setFont("Helvetica-Bold", 12)
    pdf.setFillColor(colors.HexColor("#1f2937"))
    pdf.drawString(40, y, "Boutons")
    y -= 24

    # Primary button sample
    pdf.setFillColor(colors.HexColor(css_tokens.get("brand", "#ee7768")))
    pdf.setStrokeColor(colors.HexColor(css_tokens.get("brand-strong", "#d85f51")))
    pdf.roundRect(40, y - 8, 140, 34, 8, stroke=1, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawCentredString(110, y + 4, "Action primaire")

    # Ghost button sample
    pdf.setFillColor(colors.white)
    pdf.setStrokeColor(colors.HexColor("#d6d3d1"))
    pdf.roundRect(200, y - 8, 140, 34, 8, stroke=1, fill=1)
    pdf.setFillColor(colors.HexColor("#44403c"))
    pdf.drawCentredString(270, y + 4, "Action secondaire")

    pdf.setFont("Helvetica", 9)
    pdf.setFillColor(colors.HexColor("#57534e"))
    pdf.drawString(40, 64, "Document de reference interne. Assets source dans /web/public et tokens dans /web/src/app/globals.css.")

    pdf.save()


if __name__ == "__main__":
    generate()

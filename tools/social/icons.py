"""Génère les icônes du site à partir du logo (favicon, Apple, PWA).

    python tools/social/icons.py

Sortie : assets/icons/
  favicon-16.png, favicon-32.png  -> tête du squelette (lisible en tout petit)
  apple-touch-icon.png (180)      -> logo complet sur fond noir
  icon-192.png, icon-512.png      -> logo complet, marge « maskable » (zone sûre 80 %)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / "assets" / "img" / "logo.webp"
OUT = ROOT / "assets" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

ROSA = (255, 0, 127)


def background(size: int) -> Image.Image:
    """Fond noir avec halo rose, comme l'app."""
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    r = int(size * 0.42)
    ImageDraw.Draw(glow).ellipse(
        [size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r], fill=ROSA + (110,)
    )
    bg.alpha_composite(glow.filter(ImageFilter.GaussianBlur(size * 0.12)))
    return bg


def paste_center(bg: Image.Image, art: Image.Image, max_w: float, max_h: float) -> Image.Image:
    s = bg.width
    scale = min(max_w * s / art.width, max_h * s / art.height)
    art = art.resize((round(art.width * scale), round(art.height * scale)), Image.LANCZOS)
    bg.alpha_composite(art, ((s - art.width) // 2, (s - art.height) // 2))
    return bg


logo = Image.open(LOGO).convert("RGBA")
skull = logo.crop((240, 90, 500, 350))  # tête du squelette, cadrage serré

# Petites tailles : la tête seule, à fond perdu
for size in (16, 32):
    icon = paste_center(background(size * 8), skull, 1.0, 1.0)
    icon.resize((size, size), Image.LANCZOS).save(OUT / f"favicon-{size}.png", optimize=True)

# Écran d'accueil : logo complet (Apple ajoute ses coins arrondis lui-même)
paste_center(background(180), logo, 0.86, 0.9).save(OUT / "apple-touch-icon.png", optimize=True)

# PWA : logo dans la zone sûre « maskable » (cercle de 80 %)
for size in (192, 512):
    paste_center(background(size), logo, 0.56, 0.78).save(OUT / f"icon-{size}.png", optimize=True)

for p in sorted(OUT.iterdir()):
    print(f"{p.name:24} {Image.open(p).size}  {p.stat().st_size // 1024} Ko")

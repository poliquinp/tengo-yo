"""Génère des propositions de logo « TENGO YO » via l'API OpenAI (images.edit).

Références envoyées au modèle (toutes tirées de /ref) :
  1. un spécimen « TENGO YO » rendu avec la police Luchados  -> forme exacte des lettres
  2. le squelette mariachi dansant                             -> personnage / style d'illustration
  3. une planche de la palette Día de Muertos                  -> couleurs

Usage :
  set OPENAI_API_KEY=...   (ou $env:OPENAI_API_KEY = "..." en PowerShell)
  python tools/generate_logo.py                 # 4 propositions, 3 directions
  python tools/generate_logo.py --n 2 --model gpt-image-1

Sortie : ref/logo/ (références générées + propositions PNG à fond transparent).
"""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import os
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "ref"
OUT = REF / "logo"
FONT = REF / "Fonts" / "Luchados.ttf"
SKELETON = REF / "Inspiration graphique" / "Mexican Skeleton Cartoon Dancing Illustration.png"

PALETTE = [
    ("#FF9A00", "Cempasúchil Orange"),
    ("#FF007F", "Papel Picado Pink"),
    ("#FFFFFF", "Calavera White"),
    ("#000000", "Luto Black"),
    ("#00A859", "Hopeful Green"),
    ("#FF0000", "Passionate Red"),
    ("#0077C8", "Sky Blue"),
]

BASE_PROMPT = """Design a bold, festive game logo for a party card game called "TENGO YO".

TEXT (most important): the logo must read exactly "TENGO YO" — two words, all caps, spelled T-E-N-G-O Y-O, nothing else written anywhere. Copy the letterforms exactly from the first reference image (the Luchados typeface): an ornate Western / old-circus Tuscan display serif with forked spur serifs, a pinched waist on each stem and small diamond cut-outs inside the vertical strokes, condensed tall proportions. Do not substitute another font.

CHARACTER: use the dancing skeleton from the second reference image — same cartoon calavera skull with big black eye sockets and open grinning jaw, black wide-brim sombrero, black charro jacket, red neckerchief and sash, colorful maracas. Keep its thick black outlines and flat cel-shaded vector style.

COLORS: use only the palette in the third reference image — Cempasúchil Orange #FF9A00 as the dominant accent, Papel Picado Pink #FF007F, Calavera White #FFFFFF, Luto Black #000000, with small touches of Hopeful Green #00A859, Passionate Red #FF0000 and Sky Blue #0077C8.

STYLE: Día de Muertos celebration, playful and a little cheeky (adult party game), clean vector logo, thick black outline around the whole lockup so it pops on both a black and a pink background, high contrast, legible at small sizes on a phone. Transparent background, centered, generous padding, no mockup, no photo, no extra text, no watermark.
"""

VARIANTS = {
    "stacked": "LAYOUT: vertical stacked lockup — the skeleton's head and sombrero (bust only) on top, peeking over the wordmark; 'TENGO' on the first line, 'YO' larger on the second line. Letters filled with orange-to-pink, white inner highlight, black outline.",
    "badge": "LAYOUT: circular badge / sticker — the full dancing skeleton in the middle, 'TENGO YO' on a curved papel-picado banner across the bottom, marigold (cempasúchil) petals and confetti around the rim.",
    "wordmark": "LAYOUT: horizontal wordmark — 'TENGO YO' on one line, the 'O' of 'YO' replaced by the skeleton's grinning skull wearing the black sombrero. Letters in white with pink drop shadow and black outline, a few orange marigold petals and confetti.",
}


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def build_font_specimen(path: Path) -> None:
    w, h = 1536, 1024
    img = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(img)
    size = 260
    font = ImageFont.truetype(str(FONT), size)
    for text, y in (("TENGO", 180), ("YO", 520)):
        bbox = d.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        d.text(((w - tw) / 2 - bbox[0], y), text, font=font, fill="black")
    img.save(path)


def build_palette_board(path: Path) -> None:
    w, h = 1536, 512
    img = Image.new("RGB", (w, h), "#DDDDDD")
    d = ImageDraw.Draw(img)
    sw = w // len(PALETTE)
    label = ImageFont.truetype(str(FONT), 28)
    for i, (hex_, name) in enumerate(PALETTE):
        x0 = i * sw
        d.rectangle([x0, 0, x0 + sw, h - 120], fill=hex_, outline="black", width=4)
        d.text((x0 + 12, h - 110), hex_, font=label, fill="black")
        d.text((x0 + 12, h - 70), name.split()[0], font=label, fill="black")
    img.save(path)


def build_skeleton_ref(path: Path) -> None:
    img = Image.open(SKELETON).convert("RGBA")
    img.thumbnail((1024, 1024))
    bg = Image.new("RGBA", img.size, "white")
    bg.alpha_composite(img)
    bg.convert("RGB").save(path)


def pick_model(client) -> str:
    """Prend le modèle gpt-image le plus récent disponible sur le compte."""
    try:
        ids = [m.id for m in client.models.list() if m.id.startswith("gpt-image")]
    except Exception:
        ids = []
    print("Modèles image dispo :", ", ".join(sorted(ids)) or "(aucun)")
    # On garde les alias sans date (ex. gpt-image-1.5) et on prend la version la plus haute.
    aliases = [i for i in ids if not re.search(r"\d{4}-\d{2}-\d{2}$", i) and "mini" not in i]
    if not aliases:
        return "gpt-image-1"

    def version(s: str) -> tuple:
        m = re.match(r"gpt-image-(\d+)(?:\.(\d+))?", s)
        return (int(m.group(1)), int(m.group(2) or 0)) if m else (0, 0)

    return max(aliases, key=version)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=2, help="propositions par direction")
    ap.add_argument("--model", default=None)
    ap.add_argument("--variants", default=",".join(VARIANTS), help="stacked,badge,wordmark")
    ap.add_argument("--quality", default="high", choices=["low", "medium", "high"])
    args = ap.parse_args()

    if not os.environ.get("OPENAI_API_KEY"):
        print("OPENAI_API_KEY manquante.", file=sys.stderr)
        return 1

    from openai import OpenAI

    OUT.mkdir(parents=True, exist_ok=True)
    refs_dir = OUT / "_refs"
    refs_dir.mkdir(exist_ok=True)
    font_ref = refs_dir / "1-font-specimen.png"
    skel_ref = refs_dir / "2-skeleton.png"
    pal_ref = refs_dir / "3-palette.png"
    build_font_specimen(font_ref)
    build_skeleton_ref(skel_ref)
    build_palette_board(pal_ref)

    client = OpenAI()
    model = args.model or pick_model(client)
    print(f"Modèle : {model}")
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M")

    for key in [v.strip() for v in args.variants.split(",") if v.strip()]:
        prompt = BASE_PROMPT + "\n" + VARIANTS[key]
        print(f"→ {key} ({args.n} image(s))…", flush=True)
        extra = {"input_fidelity": "high", "background": "transparent"}
        while True:
            with open(font_ref, "rb") as f1, open(skel_ref, "rb") as f2, open(pal_ref, "rb") as f3:
                try:
                    res = client.images.edit(
                        model=model,
                        image=[f1, f2, f3],
                        prompt=prompt,
                        n=args.n,
                        size="1024x1024",
                        quality=args.quality,
                        **extra,
                    )
                    break
                except Exception as e:  # paramètre non supporté par ce modèle -> on le retire
                    msg = str(e).lower()
                    bad = next((k for k in extra if k.replace("_", " ") in msg or f"'{k}'" in msg), None)
                    if not bad:
                        raise
                    print(f"   ({model} ne supporte pas {bad}, on réessaie sans)")
                    extra.pop(bad)
                    if bad == "background":
                        prompt = prompt.replace(
                            "Transparent background",
                            "Plain flat pure white (#FFFFFF) background with nothing else on it",
                        )
        for i, item in enumerate(res.data, 1):
            dest = OUT / f"logo-{slug(key)}-{stamp}-{i}.png"
            dest.write_bytes(base64.b64decode(item.b64_json))
            print(f"   {dest.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

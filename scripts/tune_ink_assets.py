# -*- coding: utf-8 -*-
from PIL import Image
from pathlib import Path

INK = Path(r"C:\Users\binchen\Desktop\code\blog\public\assets\ink")
ASSETS = Path(r"C:\Users\binchen\Desktop\code\blog\public\assets")

def posterize_alpha(im: Image.Image, levels: int = 24) -> Image.Image:
    im = im.convert("RGBA")
    r, g, b, a = im.split()
    step = 255 / (levels - 1)
    a = a.point(lambda v: int(round(v / step) * step))
    return Image.merge("RGBA", (r, g, b, a))

# blots: 560px + posterized alpha
for n, q in [("ink-blot-1", 72), ("ink-blot-2", 75)]:
    p = INK / f"{n}.webp"
    im = Image.open(p)
    im = im.resize((560, int(im.height * 560 / im.width)), Image.LANCZOS)
    im = posterize_alpha(im)
    im.save(p, "WEBP", quality=q, method=6)
    print(n, p.stat().st_size // 1024, "KB", im.size)

# dividers: posterize alpha
for n in ["brush-divider-1", "brush-divider-2"]:
    p = INK / f"{n}.webp"
    im = posterize_alpha(Image.open(p))
    im.save(p, "WEBP", quality=80, method=6)
    print(n, p.stat().st_size // 1024, "KB")

# empty boat posterize
p = INK / "empty-boat.webp"
im = posterize_alpha(Image.open(p))
im.save(p, "WEBP", quality=78, method=6)
print("empty-boat", p.stat().st_size // 1024, "KB")

# remove heavy png og
(ASSETS / "og-image.png").unlink()
print("og png removed")

# ---- proof sheet: alpha assets on paper + dark ----
names = ["seal-logo.webp", "brush-divider-1.webp", "ink-blot-1.webp", "empty-boat.webp"]
tiles = []
for n in names:
    im = Image.open(INK / n)
    im.thumbnail((340, 340))
    tiles.append((n, im))
W, H = 360 * 2, 220 * 2
for label, bg in [("paper", (247, 243, 234)), ("dark", (26, 24, 21))]:
    sheet = Image.new("RGB", (W, H), bg)
    for i, (n, im) in enumerate(tiles):
        x = (i % 2) * 360 + 10
        y = (i // 2) * 220 + 10
        sheet.paste(im, (x, y), im)
    sheet.save(Path(rf"C:\Users\binchen\.openclaw\workspace\snapshots\alpha_proof_{label}.jpg"), quality=86)
print("proof sheets saved")

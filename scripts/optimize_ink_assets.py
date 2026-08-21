# -*- coding: utf-8 -*-
"""Blog asset pipeline: white->alpha unblend, WebP compression, favicon, OG image."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

PUB = Path(r"C:\Users\binchen\Desktop\code\blog\public")
APP = Path(r"C:\Users\binchen\Desktop\code\blog\app")
INK = PUB / "assets" / "ink"
FONT_SERIF = r"C:\Users\binchen\Desktop\code\font\chinese\SourceHanSerif\SourceHanSerifCN-Bold.otf"
FONT_KAI = r"C:\Users\binchen\Desktop\code\font\chinese\LXGWWenKaiGB\LXGWWenKaiGB-Medium.ttf"

def unblend_white(im: Image.Image, floor: float = 0.045, boost: float = 1.0) -> Image.Image:
    """Treat image as ink-on-white; return RGBA with white -> transparent, color recovered."""
    im = im.convert("RGB")
    px = im.load()
    w, h = im.size
    out = Image.new("RGBA", (w, h))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            a = (255.0 - lum) / 255.0
            a = (a - floor) / (1.0 - floor)
            if a < 0:
                a = 0.0
            a *= boost
            if a > 1:
                a = 1.0
            if a <= 0.003:
                opx[x, y] = (0, 0, 0, 0)
                continue
            # recover color assuming composited over white: orig = c*a + 255*(1-a)
            nr = int(min(255, max(0, (r - 255 * (1 - a)) / a)))
            ng = int(min(255, max(0, (g - 255 * (1 - a)) / a)))
            nb = int(min(255, max(0, (b - 255 * (1 - a)) / a)))
            opx[x, y] = (nr, ng, nb, int(a * 255))
    return out

def save_webp(im: Image.Image, path: Path, q: int = 88):
    im.save(path, "WEBP", quality=q, method=6)
    print(f"{path.name}: {path.stat().st_size // 1024}KB {im.size}")

results = {}

# 1. seal-logo: 480 RGB -> alpha 192
seal = unblend_white(Image.open(INK / "seal-logo.png"))
bbox = seal.getbbox()
seal = seal.crop(bbox)
side = max(seal.size)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(seal, ((side - seal.width) // 2, (side - seal.height) // 2), seal)
seal192 = sq.resize((192, 192), Image.LANCZOS)
save_webp(seal192, INK / "seal-logo.webp", 90)

# 2. brush dividers
for n in ["brush-divider-1", "brush-divider-2"]:
    im = unblend_white(Image.open(INK / f"{n}.jpg"))
    save_webp(im, INK / f"{n}.webp", 88)

# 3. ink blots
for n in ["ink-blot-1", "ink-blot-2"]:
    im = unblend_white(Image.open(INK / f"{n}.jpg"))
    save_webp(im, INK / f"{n}.webp", 85)

# 4. empty boat (faint -> boost)
im = unblend_white(Image.open(INK / "empty-boat.jpg"), boost=1.6)
save_webp(im, INK / "empty-boat.webp", 85)

# 5. hero: raster WebP, 1920w
hero = Image.open(INK / "ink-hero.jpg").convert("RGB")
hero = hero.resize((1920, int(hero.height * 1920 / hero.width)), Image.LANCZOS)
save_webp(hero, INK / "ink-hero.webp", 80)

# 6. paper texture 400px tile
tex = Image.open(PUB / "paper-texture.png").convert("RGB").resize((400, 400), Image.LANCZOS)
save_webp(tex, PUB / "paper-texture.webp", 72)

# 7. favicon: app/icon.png 180 + apple-touch-icon 180
icon = sq.resize((180, 180), Image.LANCZOS)
icon.save(APP / "icon.png")
icon.save(APP / "apple-icon.png")
print("icon.png / apple-icon.png saved")

# 8. OG image 1200x630
W, H = 1200, 630
og = Image.new("RGB", (W, H), (247, 243, 234))
# paper texture overlay
tex_big = tex.resize((400, 400))
for ty in range(0, H, 400):
    for tx in range(0, W, 400):
        og.paste(tex_big, (tx, ty), tex_big.point(lambda v: int(255 - (255 - v) * 0.5)).convert("L").point(lambda a: 40))
# hero art bottom strip
hero_og = hero.crop((0, int(hero.height * 0.25), hero.width, hero.height)).resize((W, int(W * (hero.height * 0.75) / hero.width)), Image.LANCZOS)
hero_og = hero_og.crop((0, 0, W, 300))
mask = Image.new("L", (W, 300), 0)
md = ImageDraw.Draw(mask)
for i in range(300):
    md.line([(0, i), (W, i)], fill=int(120 * (i / 300)))
og.paste(hero_og, (0, H - 300), mask)
# seal
seal_og = sq.resize((150, 150), Image.LANCZOS)
# composite seal as multiply-ish over paper: paste via alpha
og_rgba = og.convert("RGBA")
og_rgba.paste(seal_og, (84, 74), seal_og)
og = og_rgba.convert("RGB")
d = ImageDraw.Draw(og)
f_title = ImageFont.truetype(FONT_SERIF, 92)
f_sub = ImageFont.truetype(FONT_KAI, 34)
f_small = ImageFont.truetype(FONT_KAI, 26)
d.text((270, 92), "尘墨", font=f_title, fill=(22, 19, 14))
d.text((272, 220), "binchen · 自由与宁静", font=f_sub, fill=(61, 54, 41))
d.text((272, 286), "行到水穷处，坐看云起时", font=f_small, fill=(107, 98, 82))
og.save(PUB / "assets" / "og-image.png", optimize=True)
print(f"og-image.png: {(PUB / 'assets' / 'og-image.png').stat().st_size // 1024}KB")

print("PIPELINE DONE")

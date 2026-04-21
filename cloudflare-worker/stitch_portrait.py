#!/usr/bin/env python3
"""Stitch 3 slide pages per idiom vertically into one tall portrait image.

Deck layout: cover + (5 idioms × 3 pages each)
  - Page 2,3,4 → idiom #1 (comic, 解析, 例句)
  - Page 5,6,7 → idiom #2
  - ...etc

This gives us 15 tall portrait "cards" ready for 成語卡 tab.
"""
from pathlib import Path
from PIL import Image
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = Path("E:/google drive/LWWF/Claude code/P5中文/website/assets/ch_idioms")
OUT = BASE / "cards_portrait"
OUT.mkdir(parents=True, exist_ok=True)

# Map idiom_id -> (deck_folder, comic_page, analysis_page, example_page)
MAP = {}
for group_idx, (deck, start_id) in enumerate([("slides1",31),("slides2",36),("slides3",41)]):
    for i in range(5):
        idiom_id = start_id + i
        base_p = 2 + i*3  # p02, p05, p08, p11, p14 for comic
        MAP[idiom_id] = (deck, base_p, base_p+1, base_p+2)

PAD = 10
BG = (255, 253, 245)  # cream

for idiom_id, (deck, p1, p2, p3) in MAP.items():
    imgs = []
    for p in [p1, p2, p3]:
        img_path = BASE / deck / f"p{p:02d}.jpg"
        if not img_path.exists():
            print(f"  [X] missing {img_path}")
            continue
        imgs.append(Image.open(img_path).convert("RGB"))

    if len(imgs) != 3:
        print(f"  [X] idiom_{idiom_id}: only {len(imgs)}/3 pages")
        continue

    # Resize all to same width (use widest)
    target_w = max(im.width for im in imgs)
    resized = []
    for im in imgs:
        if im.width != target_w:
            ratio = target_w / im.width
            im = im.resize((target_w, int(im.height*ratio)), Image.LANCZOS)
        resized.append(im)

    # Stack vertically with small padding between
    total_h = sum(im.height for im in resized) + PAD*4
    canvas = Image.new("RGB", (target_w + PAD*2, total_h), BG)
    y = PAD
    for im in resized:
        canvas.paste(im, (PAD, y))
        y += im.height + PAD

    # Save PNG + WebP
    png = OUT / f"card_{idiom_id}.png"
    canvas.save(png, "PNG", optimize=True)

    # Downscale for webp (max 800 wide)
    w, h = canvas.size
    if w > 800:
        ratio = 800 / w
        small = canvas.resize((800, int(h*ratio)), Image.LANCZOS)
    else:
        small = canvas
    webp = OUT / f"card_{idiom_id}.webp"
    small.save(webp, "WEBP", quality=85, method=6)
    print(f"  card_{idiom_id}: {canvas.size[0]}x{canvas.size[1]} -> {webp.stat().st_size/1024:.0f} KB")

print(f"\nDone. Output: {OUT}")

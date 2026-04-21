#!/usr/bin/env python3
"""Convert PNG to WebP for faster loading, preserve originals."""
from pathlib import Path
from PIL import Image
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = Path("E:/google drive/LWWF/Claude code/P5中文/website/assets/ch_idioms")

# Convert idiom images (max 768px, quality 85)
for png in (BASE / "images").glob("*.png"):
    webp = png.with_suffix(".webp")
    if webp.exists(): continue
    im = Image.open(png).convert("RGBA")
    if im.width > 768:
        ratio = 768 / im.width
        im = im.resize((768, int(im.height*ratio)), Image.LANCZOS)
    im.save(webp, "WEBP", quality=85, method=6)
    print(f"  {png.name} -> {webp.name} ({webp.stat().st_size/1024:.0f} KB)")

# Convert NLM infographics (max 1200px, quality 85)
for png in (BASE / "infographics").glob("*.png"):
    webp = png.with_suffix(".webp")
    if webp.exists(): continue
    im = Image.open(png).convert("RGB")
    if im.width > 1200:
        ratio = 1200 / im.width
        im = im.resize((1200, int(im.height*ratio)), Image.LANCZOS)
    im.save(webp, "WEBP", quality=85, method=6)
    print(f"  {png.name} -> {webp.name} ({webp.stat().st_size/1024:.0f} KB)")

print("Done.")

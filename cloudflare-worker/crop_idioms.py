#!/usr/bin/env python3
"""Crop NLM bento-grid infographics into 15 individual idiom tiles.

All 3 infographics share the same layout:
  - Title band: 0% to ~7.5% height
  - Row 1 (2 tiles): ~8% to ~36%
  - Row 2 (1 wide tile): ~37% to ~63%
  - Row 3 (2 tiles): ~64% to ~99%
"""
from pathlib import Path
from PIL import Image
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = Path("E:/google drive/LWWF/Claude code/P5中文/website/assets/ch_idioms")
OUT = BASE / "images"
OUT.mkdir(parents=True, exist_ok=True)

# group_file -> [(idiom_id, crop_box), ...]
# crop_box = (left, top, right, bottom) in pixels; source is 1536x2752

# Tune these crop boxes based on visual inspection. Each infographic has:
#  Top row 2 tiles, middle wide tile, bottom row 2 tiles.
LAYOUT = {
    # Boundaries from auto-detected row gaps (detect_tiles.py)
    "group1_31-35.png": [
        (31, (40,  275, 755,  1143)),   # 拍案叫絕 (top-left)
        (32, (780, 275, 1495, 1143)),   # 惟妙惟肖 (top-right)
        (33, (40,  1175, 1495, 1757)),  # 舐犢情深 (middle wide)
        (34, (40,  1789, 755, 2700)),   # 臨崖勒馬 (bottom-left)
        (35, (780, 1789, 1495, 2700)),  # 眾目睽睽 (bottom-right)
    ],
    "group2_36-40.png": [
        (36, (40,  326, 755,  1237)),
        (37, (780, 326, 1495, 1237)),
        (38, (40,  1256, 1495, 1818)),
        (39, (40,  1840, 755, 2700)),
        (40, (780, 1840, 1495, 2700)),
    ],
    "group3_41-45.png": [
        (41, (40,  200, 755,  1067)),
        (42, (780, 200, 1495, 1067)),
        (43, (40,  1107, 1495, 1870)),
        (44, (40,  1904, 755, 2620)),
        (45, (780, 1904, 1495, 2620)),
    ],
}

# Backup already done on first run; just overwrite from now on
for f in list(OUT.glob("idiom_*.png")) + list(OUT.glob("idiom_*.webp")):
    f.unlink()

for group_file, tiles in LAYOUT.items():
    src = BASE / "infographics" / group_file
    im = Image.open(src).convert("RGB")
    print(f"[{group_file}] {im.size}")
    for idiom_id, box in tiles:
        tile = im.crop(box)
        # Save as square PNG (don't distort — just use the crop as-is)
        png_path = OUT / f"idiom_{idiom_id}.png"
        tile.save(png_path, "PNG", optimize=True)
        # Save downscaled WebP
        w, h = tile.size
        max_side = 600
        if max(w, h) > max_side:
            ratio = max_side / max(w, h)
            tile = tile.resize((int(w*ratio), int(h*ratio)), Image.LANCZOS)
        webp_path = OUT / f"idiom_{idiom_id}.webp"
        tile.save(webp_path, "WEBP", quality=88, method=6)
        print(f"  idiom_{idiom_id}: crop={box} -> {webp_path.stat().st_size/1024:.0f} KB")

print("\nDone.")

"""Draw crop boxes on all 3 sources for visual inspection."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BASE = Path("E:/google drive/LWWF/Claude code/P5中文/website/assets/ch_idioms")

CONFIG = {
    "group1_31-35.png": [(40,220,755,1130), (780,220,1495,1130), (40,1160,1495,1720), (40,1750,755,2700), (780,1750,1495,2700)],
    "group2_36-40.png": [(40,220,755,1130), (780,220,1495,1130), (40,1160,1495,1720), (40,1750,755,2700), (780,1750,1495,2700)],
    "group3_41-45.png": [(40,220,755,1130), (780,220,1495,1130), (40,1160,1495,1720), (40,1750,755,2700), (780,1750,1495,2700)],
}

for fname, boxes in CONFIG.items():
    src = BASE / "infographics" / fname
    im = Image.open(src).convert("RGB")
    draw = ImageDraw.Draw(im)
    for i, box in enumerate(boxes):
        draw.rectangle(box, outline=(255, 0, 0), width=16)
    out = BASE / f"_preview_{fname.split('.')[0]}.png"
    # resize to viewable
    im.thumbnail((500, 900))
    im.save(out, "PNG")
    print(f"saved: {out}")

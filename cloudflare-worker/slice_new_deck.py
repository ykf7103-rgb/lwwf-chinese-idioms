"""Slice the NEW 15-page 9:16 NLM deck (simpler layout, no 3-panel comic).

Layout per 768×1376 page:
  0 –  4% : #編號 badge (top-right)
  4 – 20% : 成語大字 + 粵拼 + 普拼
 22 – 62% : 正方形插圖 (clean 1:1)
 62 – 78% : 意思 + 例句 boxes
 78 – 92% : 近義詞 / 反義詞 row
 92 –100% : 適用作文 box
"""
import sys
from pathlib import Path
import fitz

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = Path("G:/My Drive/LWWF/Claude code/P5中文/website/assets/ch_idioms")
PDF  = BASE / "slides" / "new_15page_deck.pdf"

NEW_CARDS = BASE / "new_cards_9x16"
NEW_TILES = BASE / "new_tiles"
for d in (NEW_CARDS, NEW_TILES):
    d.mkdir(parents=True, exist_ok=True)

RENDER_SCALE = 2.2
# Tighter crop that captures the square illustration only (with its white frame)
ILLUSTRATION = (0.055, 0.245, 0.945, 0.615)

doc = fitz.open(PDF)
assert len(doc) == 15, f"Expected 15 pages, got {len(doc)}"

for i, page in enumerate(doc):
    idiom_id = 31 + i
    W, H = page.rect.width, page.rect.height
    mat = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)

    full = page.get_pixmap(matrix=mat)
    card_jpg = NEW_CARDS / f"idiom_{idiom_id}.jpg"
    full.save(str(card_jpg), jpg_quality=85)

    x0, y0, x1, y1 = [
        ILLUSTRATION[0] * W, ILLUSTRATION[1] * H,
        ILLUSTRATION[2] * W, ILLUSTRATION[3] * H,
    ]
    tile = page.get_pixmap(matrix=mat, clip=fitz.Rect(x0, y0, x1, y1))
    tile_jpg = NEW_TILES / f"idiom_{idiom_id}.jpg"
    tile.save(str(tile_jpg), jpg_quality=88)

    print(f"  idiom_{idiom_id:2}  card {card_jpg.stat().st_size // 1024}KB  "
          f"tile {tile_jpg.stat().st_size // 1024}KB")

doc.close()
print(f"\nDone. 15 idioms × 2 crops each → {BASE}")

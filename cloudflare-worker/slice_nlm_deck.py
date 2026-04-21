"""Slice the 15-page 9:16 NLM deck into 3 layers per idiom:
  - cards_9x16/idiom_{id}.jpg  — full 9:16 page (成語卡 tab)
  - tiles/idiom_{id}.jpg       — centered illustration (配對遊戲 tile)
  - comics/idiom_{id}.jpg      — bottom 3-panel 劇場 strip (future games)

Page layout (based on visual inspection of 768×1376 canvas):
  0 – 15%  : 卷軸大字 banner
 15 – 18%  : 拼音細字
 18 – 46%  : 中央插圖 (illustration)
 46 – 61%  : 意思 + 字字拆解
 61 – 70%  : 例句 banner
 70 – 89%  : 3 格劇場 (comic strip)
 89 –100%  : 近反義 + 作文 + #主題 tags
"""
import sys
from pathlib import Path
import fitz  # PyMuPDF

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = Path("G:/My Drive/LWWF/Claude code/P5中文/website/assets/ch_idioms")
PDF  = BASE / "slides" / "prev_15page_deck.pdf"

CARDS  = BASE / "cards_9x16"
TILES  = BASE / "tiles"
COMICS = BASE / "comics"
for d in (CARDS, TILES, COMICS):
    d.mkdir(parents=True, exist_ok=True)

RENDER_SCALE = 2.2   # 768×1376 → 1690×3027 for crisp output

# y ratios (normalized 0-1) of each region within the page
# Tuned loosely; can be refined if a page's illustration is off.
ILLUSTRATION = (0.045, 0.180, 0.955, 0.462)   # (x0, y0, x1, y1)
COMIC_STRIP  = (0.045, 0.695, 0.955, 0.895)

# 1 page == 1 idiom, id = 31 + page_index
doc = fitz.open(PDF)
assert len(doc) == 15, f"Expected 15 pages, got {len(doc)}"

for i, page in enumerate(doc):
    idiom_id = 31 + i
    W, H = page.rect.width, page.rect.height

    # ---- Full card (9:16) ----
    mat = fitz.Matrix(RENDER_SCALE, RENDER_SCALE)
    full = page.get_pixmap(matrix=mat)
    card_jpg = CARDS / f"idiom_{idiom_id}.jpg"
    full.save(str(card_jpg), jpg_quality=85)

    # ---- Tile (center illustration, cropped as-is) ----
    x0, y0, x1, y1 = [
        ILLUSTRATION[0] * W, ILLUSTRATION[1] * H,
        ILLUSTRATION[2] * W, ILLUSTRATION[3] * H,
    ]
    clip = fitz.Rect(x0, y0, x1, y1)
    tile = page.get_pixmap(matrix=mat, clip=clip)
    tile_jpg = TILES / f"idiom_{idiom_id}.jpg"
    tile.save(str(tile_jpg), jpg_quality=88)

    # ---- Comic strip ----
    cx0, cy0, cx1, cy1 = [
        COMIC_STRIP[0] * W, COMIC_STRIP[1] * H,
        COMIC_STRIP[2] * W, COMIC_STRIP[3] * H,
    ]
    comic = page.get_pixmap(matrix=mat, clip=fitz.Rect(cx0, cy0, cx1, cy1))
    comic_jpg = COMICS / f"idiom_{idiom_id}.jpg"
    comic.save(str(comic_jpg), jpg_quality=85)

    print(f"  idiom_{idiom_id:2}  "
          f"card {card_jpg.stat().st_size // 1024}KB  "
          f"tile {tile_jpg.stat().st_size // 1024}KB  "
          f"comic {comic_jpg.stat().st_size // 1024}KB")

doc.close()
print(f"\nDone. 15 idioms × 3 crops each → {BASE}")

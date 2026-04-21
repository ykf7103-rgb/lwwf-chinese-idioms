#!/usr/bin/env python3
"""Convert NLM PDF slide decks to JPG images (one per page) for slide viewer."""
import sys
from pathlib import Path
import fitz  # PyMuPDF

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SLIDES_DIR = Path("E:/google drive/LWWF/Claude code/P5中文/website/assets/ch_idioms/slides")

DECKS = [
    ("deck1_31-35.pdf", "slides1"),
    ("deck2_36-40.pdf", "slides2"),
    ("deck3_41-45.pdf", "slides3"),
]

DPI = 110  # ~900px wide on typical slide; keeps files <150KB each

for pdf_name, out_folder_name in DECKS:
    pdf_path = SLIDES_DIR / pdf_name
    if not pdf_path.exists():
        print(f"[SKIP] {pdf_name} not found")
        continue

    out_dir = SLIDES_DIR.parent / out_folder_name
    out_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    print(f"[{pdf_name}] {len(doc)} pages -> {out_dir.name}/")
    for i, page in enumerate(doc, 1):
        pix = page.get_pixmap(dpi=DPI)
        out_file = out_dir / f"p{i:02d}.jpg"
        pix.save(str(out_file), jpg_quality=82)
        size_kb = out_file.stat().st_size / 1024
        print(f"  p{i:02d}.jpg  {size_kb:.0f} KB")
    doc.close()

print("\nDone.")

"""Render PDF pages to PNG for preview."""
import sys
import fitz
from pathlib import Path

pdf_path = Path(sys.argv[1])
out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else pdf_path.parent / "_preview"
out_dir.mkdir(parents=True, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Pages: {len(doc)}  Size: {doc[0].rect}")
for i in range(len(doc)):
    page = doc[i]
    pix = page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2))
    fn = out_dir / f"p{i+1:02d}.png"
    pix.save(str(fn))
    print(f"  p{i+1:02d}  {pix.width}x{pix.height}  {fn.stat().st_size // 1024}KB")
doc.close()

"""Detect row gaps (low-saturation horizontal strips between tiles)."""
from PIL import Image
import numpy as np
from pathlib import Path
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = Path("E:/google drive/LWWF/Claude code/P5中文/website/assets/ch_idioms")

for fname in ["group1_31-35.png", "group2_36-40.png", "group3_41-45.png"]:
    im = Image.open(BASE / "infographics" / fname).convert("RGB")
    arr = np.array(im)
    H, W, _ = arr.shape

    r, g, b = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int)
    # Gap detection: row is a "gap" if it's mostly cream/white (R~G~B and high brightness)
    mn = np.minimum(np.minimum(r, g), b)
    mx = np.maximum(np.maximum(r, g), b)
    sat = np.where(mx>0, (mx-mn).astype(float) / mx.clip(min=1), 0)
    brightness = (r + g + b) / 3.0

    # Lower threshold for gap - more permissive
    row_sat = sat.mean(axis=1)
    row_bright = brightness.mean(axis=1)
    # A "plain" row has low std dev (uniform color)
    row_std = arr.reshape(H, -1).std(axis=1)

    is_gap = (row_sat < 0.25) & (row_bright > 200) & (row_std < 60)
    is_gap[:200] = False

    gaps = []
    start = None
    for y, v in enumerate(is_gap):
        if v and start is None:
            start = y
        elif not v and start is not None:
            if y - start >= 10:
                gaps.append((start, y))
            start = None
    if start is not None:
        gaps.append((start, H))

    print(f"\n{fname}: {len(gaps)} gap bands (sat<0.25, bright>200, std<60)")
    for a, b in gaps:
        print(f"  gap: y={a}..{b} (h={b-a})")

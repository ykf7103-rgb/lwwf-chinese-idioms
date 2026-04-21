#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate 15 idiom illustration scenes for P5 中文成語 matching game.

These are full scene illustrations (NOT characters), so we KEEP the background
for each image. No rembg. Just Flux schnell via Cloudflare Worker.
"""
import base64
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

WORKER = "https://lwwf-math-ai.lwwfaiteams.workers.dev/image"
OUT_DIR = Path("E:/google drive/LWWF/Claude code/P5中文/website/assets/ch_idioms/images")
OUT_DIR.mkdir(parents=True, exist_ok=True)

DELAY = 3

# style suffix appended to every prompt — matches idiom textbook illustration feel
STYLE = " kawaii cartoon style, flat illustration, vibrant colors, children picture book, clean composition, no text, no letters, simple background"

IDIOMS = [
    ("idiom_31", "a child sitting in theater audience excitedly clapping a table, magician on stage pulling white rabbit from hat, spotlights on stage, surprised audience"),
    ("idiom_32", "little girl artist holding paintbrush, painting a vivid cartoon portrait of a smiling teacher on easel, the painting looks exactly like the teacher, art classroom"),
    ("idiom_33", "mother cow gently licking a baby calf on the forehead in a sunny pasture, green grass, warm sunset, loving family of cows"),
    ("idiom_34", "ancient chinese general on horseback stopping suddenly at edge of tall cliff, horse rearing up, mountains behind, dramatic scene"),
    ("idiom_35", "many people at subway station staring with wide open eyes at one man cutting the queue, shocked expressions, crowd scene"),
    ("idiom_36", "child painting a messy picture with too many paint colors mixed together, frustrated sad expression, art studio, colorful mess"),
    ("idiom_37", "pianist and violinist playing music together on stage, musical notes floating in the air, perfect harmony, concert hall lights"),
    ("idiom_38", "boastful kid standing on playground bragging loudly to classmates, other children secretly laughing behind hands, school yard"),
    ("idiom_39", "ancient chinese gentleman in robes walking past watermelon field, stopping with hand not bending down, traditional setting"),
    ("idiom_40", "kid completely absorbed in mobile phone game, mother in background shouting but kid ignoring, living room, sound waves from mother"),
    ("idiom_41", "majestic tiger with golden glowing wings soaring through clouds, powerful and grand, fantasy sky scene"),
    ("idiom_42", "children playing telephone whisper game in a row, the message getting more distorted as it travels, thought bubbles changing shape"),
    ("idiom_43", "newspaper headlines showing many different kinds of scams, waves of news coming one after another, busy news desk scene"),
    ("idiom_44", "family preparing for typhoon, father taping windows, mother stocking food, children checking flashlights, clouds outside, preparation scene"),
    ("idiom_45", "ancient chinese painter holding two brushes one in each hand, painting mountains and pine trees simultaneously on large scroll, traditional art studio"),
]


def generate(name, prompt):
    out = OUT_DIR / f"{name}.png"
    if out.exists() and out.stat().st_size > 5000:
        print(f"  [skip] {name} already exists")
        return True

    full_prompt = prompt + "," + STYLE
    req = urllib.request.Request(
        WORKER,
        data=json.dumps({"prompt": full_prompt, "width": 768, "height": 768}).encode(),
        headers={
            "Content-Type": "application/json",
            "Origin": "http://localhost:8080",
            "Referer": "http://localhost:8080/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:300]
        print(f"  [X] {name}: HTTP {e.code} - {body}")
        return False
    except Exception as e:
        print(f"  [X] {name}: {e}")
        return False

    b64 = data.get("image")
    if not b64:
        print(f"  [X] {name}: {data.get('error','no image')} - {data.get('message','')}")
        return False

    raw = base64.b64decode(b64)
    out.write_bytes(raw)
    size_kb = out.stat().st_size / 1024
    print(f"  [OK] {name}.png  {size_kb:.1f} KB  (provider={data.get('provider')})")
    return True


def main():
    ok = 0
    targets = IDIOMS
    if len(sys.argv) > 1 and sys.argv[1] == "first5":
        targets = IDIOMS[:5]
    for i, (name, prompt) in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {name}")
        if generate(name, prompt):
            ok += 1
        if i < len(targets):
            time.sleep(DELAY)
    print(f"\n==== Done: {ok}/{len(targets)} ====")


if __name__ == "__main__":
    main()

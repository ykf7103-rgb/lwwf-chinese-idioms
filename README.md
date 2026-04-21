# 成語小博士 · P.5 中文校本 AI 學習平台

樂善堂梁黃蕙芳紀念學校 · 五年級中文 · 第 31-45 題成語（課本 P.58-62）

## 📖 內容

- **15 個成語**完整資料（意思、粵拼、普拼、字字解釋、例句、四格故事、近反義、寫作應用）
- **教師級簡報**：3 本 PDF（每成語 3 頁教學）+ 2 本 15 頁成語卡（豐富版 / 精簡版）
- **NLM 生成**：粵語 podcast、普通話影片、廣東話影片、3 張資訊圖
- **互動遊戲 × 5**：配對選擇、翻牌記憶（易/中/難）、主題分類、字字拼字、填充測驗

## 🗂️ 檔案結構

```
website/
├── index.html              ← 單頁網站（8 tabs）
├── data/
│   ├── idioms.json         ← 15 個成語資料（手動編輯）
│   ├── mindmap.json        ← 思維導圖（中文）
│   ├── study_guide.md      ← 完整溫習筆記（markdown）
│   └── ...
├── assets/ch_idioms/
│   ├── cards_9x16/         ← 15 張豐富版成語卡（含 3 格劇場）
│   ├── new_cards_9x16/     ← 15 張精簡版成語卡
│   ├── tiles/              ← 15 張豐富版中央插圖
│   ├── new_tiles/          ← 15 張精簡版中央插圖（遊戲用）
│   ├── comics/             ← 15 條 3 格劇場條
│   ├── infographics/       ← 3 張資訊圖（PNG/WebP）
│   ├── slides/             ← 5 本 PDF（3 本 3 組 deck + 2 本 15 頁）
│   ├── slides1/2/3/        ← 3D page-flip book 逐頁 JPG
│   ├── audio/podcast.m4a   ← 粵語 NLM 兩主持講解
│   └── video/
│       ├── summary.mp4          ← 廣東話原版影片
│       └── summary_mandarin.mp4 ← 普通話版影片
└── cloudflare-worker/      ← 生圖/切圖/轉檔 Python 腳本
```

## 🔧 本地啟動

```bash
# 靜態檔案，任何 HTTP server 都可以
npx http-server -p 8765 -c-1
# 或
python -m http.server 8765
```

瀏覽 http://localhost:8765/

## 🏫 同系列專案

- [lwwf-math-ai](https://github.com/ykf7103-rgb/lwwf-math-ai) — 樂善堂梁黃蕙芳紀念學校 · 五年級數學 AI 學習區

---
© 樂善堂梁黃蕙芳紀念學校 · 校本 AI 學習材料

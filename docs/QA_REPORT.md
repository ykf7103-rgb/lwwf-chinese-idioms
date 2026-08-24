# QA 報告

日期：2026-08-23

## 發布前結果

- `npm run check`：通過。
- Playwright：desktop／mobile 14／14 通過。
- `npm audit`：0 個已知漏洞。
- 敏感邊界：沒有子站登入、名冊、摘要、browser storage、直接學生資料庫、前端評分 Worker、供應商或提示詞請求。
- SSO 契約：官方 SDK、無 defer 的早期 fragment 接收、memory-only session、開始／完成 Promise queue 及精確白名單檢查通過。
- 教師巡堂：synthetic、read-only、memory-only、中央事件零寫入、評分及交易請求為零。
- 視覺：桌面及 390px 手機沒有可見破圖、console error 或頁面水平溢出。

## 證據

- `_verification/passport-preview-desktop.png`
- `_verification/passport-preview-mobile.png`

## Passport／Teacher impact

- Passport impact：native SSO、fragment scrub、開始及任務完成 evidence、中央 feedback widget。
- Teacher impact：新增可聚合的受控成語證據；巡堂保持零寫入。

正式發布後必須追加 live URL、Pages commit／run 及正式 SSO 抽查結果。

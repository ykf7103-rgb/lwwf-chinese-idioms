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

以下追加 live URL、Pages commit／run 及正式站抽查結果。

## 正式發布後結果

- 功能 commit：`1006de3`；回復點：`bd602cc`。
- GitHub Pages run `32683594542`：成功。
- 正式 URL：HTTP 200。
- 正式 HTML：官方 Passport SDK 存在；子站密碼欄位不存在。
- 正式 integration script：`idiom-master-p5-2026.08-v1` 存在；舊外部評分 Worker 代號不存在。
- 正式 Playwright：desktop／mobile 14／14 通過；包含 wrong-site／wrong-grade fail closed、7A 類型身分免第二登入、fragment scrub、start→mission queue、固定規則回饋、教師零寫入、破圖／console／水平溢出。
- 正式全鏈 SSO 尚需中央 registry 原生分流在同一批部署完成後再驗證；此項不以子站模擬結果代替。

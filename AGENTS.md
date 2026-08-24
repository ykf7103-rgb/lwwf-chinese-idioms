# AGENTS.md

## 專案真相

- 正式源碼：Git repository `ykf7103-rgb/lwwf-chinese-idioms` 的 `main` 分支。
- 正式網站：GitHub Pages，以 `main` 分支根目錄發布。
- Learning Passport site id：`lwwf-chinese-idioms`；正式內容年級：`p5`。
- 發布前必須執行 `npm run qa`，發布後必須重新驗證正式網址。

## 身分與資料安全

- 身分只來自中央 `window.LWWFPassport.init()` 的公開狀態；不可建立子站帳戶、密碼、名冊或密碼摘要。
- 不可把憑證、身分工作階段、學生自由文字或錄音保存至 browser storage、DOM、debug、log 或進度 metadata。
- 學生進度只可經官方 SDK `recordProgress()` 回傳本文件登記的白名單摘要。
- 教師巡堂必須同時為 `mode=teacher-preview`、`readOnly=true`、`studentView.synthetic=true`；否則停止載入。
- 巡堂只可使用記憶體沙盒，不得寫入進度、儲存、資料庫、評分服務或交易。
- 浮動回報只由中央 SDK `feedbackWidget` 提供。

## 修改與驗證

- 保留既有「成語任務章」功能。
- 最少核對桌面及 390px 手機、破圖、console error、水平溢出、start/completion 契約、零巡堂寫入及敏感字串。
- 不可在文件、測試輸出或回報中記錄任何憑證或學生個人資料。

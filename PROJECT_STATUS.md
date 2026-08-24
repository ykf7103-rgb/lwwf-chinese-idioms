# PROJECT_STATUS.md

最後更新：2026-08-23

## 正式來源

- Repository：`ykf7103-rgb/lwwf-chinese-idioms`
- GitHub Pages：`https://ykf7103-rgb.github.io/lwwf-chinese-idioms/`
- 發布來源：`main` 分支根目錄。
- Learning Passport site id：`lwwf-chinese-idioms`；正式內容年級：P5。

## 2026-08-23 原生 Learning Passport 發行候選

- `HAS_PASSPORT_SSO: true`
- `PASSPORT_BRIDGE: official-lwwf-passport-sdk`
- 子站登入表單、教師前端密碼、嵌入式學生名冊／密碼摘要及瀏覽器身分持久化均已移除。
- opaque handoff fragment 由位於 `<head>` 的官方 SDK 同步接收並清除；站點 session 只由 SDK 保存於記憶體。
- 7A 類型的全站測試身分進入本站後不需第二次登入；本站仍只載入 P5 正式內容。
- 首次可寫學生工作階段送出冪等開始事件；五個任務章完成事件經同一 Promise queue 依序回傳。
- 進度 metadata 只包含中央已登記的數值、布林與受控枚舉；不包含姓名、班別、自由文字、錄音、供應商或提示詞。
- 教師巡堂使用 synthetic、read-only、memory-only 沙盒，中央及本機寫入均為零。
- 浮動回報由中央 SDK 建立。
- 原有學生端直接外部評分請求已移除；文字只在本頁以固定規則提供學習回饋，本站不保存或傳送學生答案。可選語音辨識由瀏覽器提供。

## Passport／Teacher impact

- Passport impact：原生單一登入、開始事件、任務完成證據、官方回報元件。
- Teacher impact：新增可聚合的 P5 成語開始／完成／準確率／嘗試／錯誤／支援摘要；巡堂維持唯讀零寫入。
- 中央相依：registry 必須設 `passportWrapper:false`；中央 Worker 必須接受 `docs/LEARNING_EVIDENCE.md` 的精確白名單契約。

## 驗證

- `npm run check`：通過。
- Playwright：desktop／390px mobile 共 14 個情境通過。
- `npm audit`：0 個已知漏洞。
- 視覺核對：桌面及手機任務章、巡堂提示、無水平頁面溢出及無可見破圖。

## 正式發布

- 功能發布 commit：`1006de3`。
- GitHub Pages run：`32683594542`，build／deploy／status 全部成功。
- 正式網址回應 200，已載入官方 SDK 及 `idiom-master-p5-2026.08-v1` 契約；正式 HTML 沒有子站密碼欄位，正式 integration script 沒有舊評分 Worker。
- 正式網址 Playwright（單一 worker，避免對公開靜態資產造成不必要的並行負載）：desktop／mobile 14／14 通過。
- 待中央同一批版本把 registry 設為 `passportWrapper:false`，才可完成真正 Passport→成語→其他科目的 7A 全鏈 E2E；子站已準備並不再接受第二登入。

## 回復

- 發布前基線：`bd602cc`。
- 如正式站回歸，將 GitHub Pages `main` 回復至發布前 commit；不可回復中央 English native 分流。

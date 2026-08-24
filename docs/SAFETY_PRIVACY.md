# 身分、私隱與巡堂安全邊界

## 中央身分

本站沒有子站登入。官方 Learning Passport SDK 從 URL fragment 同步接收一次性交接資料並立即清除，只把受 site、grade、origin 限定的站點 session 保存在記憶體。沒有有效工作階段時，頁面只顯示返回中央入口的按鈕。

## 學生模式

- 學習證據只經 `LWWFPassport.recordProgress()` 回傳受控摘要。
- 子站不使用 localStorage、sessionStorage 或 IndexedDB 保存身分或進度。
- 本站程式不保存學生文字或錄音，也不把答案送往本站的後端或外部評分服務；可選語音辨識由瀏覽器提供，使用者亦可直接打字。

## 教師巡堂

只有中央狀態同時符合 `teacher-preview`、`readOnly` 及 synthetic student view 才能進入。巡堂操作只存在記憶體；不送開始或完成事件、不讀真實學生資料、不寫 storage、不呼叫外部評分及不交易。

## 回報問題

浮動回報由中央 SDK 建立；本站不保存回報憑證，也不另設教師密碼。

# 驗收測試

執行 `npm run qa`，驗證：

1. 無中央工作階段時只顯示 Learning Passport 入口，沒有密碼輸入。
2. 7A 測試身分進入後不需第二登入。
3. 開始事件固定為 false／0 分／0 獎勵並先於完成事件。
4. 五關任務只送白名單 metadata 及 teacher evidence。
5. 教師巡堂為 synthetic、read-only、memory-only 且進度寫入為零。
6. 浮動回報元件可建立。
7. 本機語音文字回饋不呼叫外部評分服務。
8. desktop／390px mobile 沒有可見破圖、console error 或頁面水平溢出。

視覺證據保存於 `_verification/`；測試不使用正式學生資料或憑證。

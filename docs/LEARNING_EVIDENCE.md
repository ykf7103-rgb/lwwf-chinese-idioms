# Learning Passport 學習證據契約

## 固定範圍

- `siteId`: `lwwf-chinese-idioms`
- `grade`: `p5`（由站點 session 驗證，不由前端 metadata 提供）
- `schemaVersion`: `lwwf-progress/v2`
- `contentVersion`: `idiom-master-p5-2026.08-v1`
- 所有事件的 `coins`：`0`
- 所有事件經同一 Promise queue 序列化。

## 開始事件

- `taskId`: `idiom-v1:start:p5`
- `completed`: `false`
- `score`: `0`
- `metadata.action`: `start_learning`
- `metadata.activityType`: `idiom-learning-start`
- `metadata.objectiveId`: `idiom-foundation`
- `completedTasks`: `0`；`totalTasks`: `5`；`attempts`／`mistakes`／`accuracy`: `0`
- `teacherEvidence.completed`: `false`；`skillsPracticed`: `[]`；`needsSupport`／`supportUsed`: `false`

## 任務完成事件

- `taskId`: `idiom-v1:mission:<missionId>`
- `missionId` 枚舉：`meaning|context|misuse|value|writing`
- `completed`: `true`
- `metadata.action`: `complete_task`
- `metadata.activityType`: `idiom-mission`
- `objectiveId`: `idiom-<missionId>`
- `completedTasks`: 實際累計 `1..5`；`totalTasks`: `5`
- `attempts`: 正整數；`mistakes`: `attempts - 1`；`accuracy`: `round(100 / attempts)`，限制 `0..100`

## teacherEvidence

- `schemaVersion`: `teacher-evidence/v1`
- 欄位：`objectiveId`、`completed`、`score`、`accuracy`、`attempts`、`mistakes`、`skillsPracticed`、`needsSupport`、`supportUsed`
- `skillsPracticed` 受控值：
  - `meaning-recognition`
  - `context-application`
  - `misuse-detection`
  - `value-connection`
  - `sentence-writing`

不傳送姓名、班別、學號、自由文字、語音、答案原文、憑證、提示詞、供應商或路由名稱。開始標記不得加入完成、準確率、錯誤、策略或獎勵統計。

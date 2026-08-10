# LingoQuest MVP

LingoQuest 的第一個可玩垂直切片：玩家從每日城市主頁進入 School Lv.1，完成三題英文挑戰；答對至少兩題即可占領領地。答錯題目會在結果結算時一次寫入複習佇列，之後可從領地頁啟動巡邏，沿用同一個挑戰畫面重做錯題。

## 技術與範圍

- Expo React Native + TypeScript
- Expo Router 導覽
- Zustand 狀態管理
- AsyncStorage 本機持久化
- 僅持久化 `territoryLevel` 與 `reviewQueue`；作答過程留在記憶體，結果頁才以單一 snapshot 寫入
- 不含後端、登入、AI／語音評分、資源經濟、挑戰中途續玩、聯盟／PVP、賽季或轉蛋

## 執行與驗證

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm start
```

## 協作與回報流程

每個可驗證的增量都以意圖清楚的 commit 推送到 GitHub。協作者可直接針對最新 commit／Issue 留下意見；下一輪修改前，先回報已完成項目、驗證結果與阻礙，讓討論有一致基準。

## 後續視覺方向

後續迭代會朝原創的行動裝置 SLG／策略遊戲氛圍演進：建立更有戰略感的世界地圖、可辨識的中央城市、領地格與行軍／攻擊操作提示，並強化資訊層級與戰場氣氛。可參考三國題材策略遊戲的高階類型感受，但不複製任何既有作品的美術、名稱、版面或其他受保護資產。此方向只影響視覺與操作表現，不擴張目前 MVP 的玩法範圍。

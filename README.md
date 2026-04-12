# Identity V Rank Analyzer - Frontend

這是一個基於 React 19 開發的現代化遊戲資料分析前端介面。
專注於清晰的操作流程、穩定的登入體驗，以及可擴充的應用架構。

「千場對局，逐步分析，讓你看見個人趨勢。」

## 專案亮點

- 現代化 UI/UX：以簡潔卡片式資訊呈現，降低閱讀負擔。
- 響應式設計：同時適配桌面端與行動端瀏覽器。
- 完整認證流程：包含登入、註冊、OAuth、Token 自動刷新與路由守護。
- 錯誤處理：針對網路錯誤與認證失效提供即時回饋。
- API Key 管理：支援建立與停用，強化外部整合能力。

## 關鍵技術棧

- 框架: React 19
- 語言: TypeScript
- 路由: React Router DOM 7
- 樣式: CSS Modules
- 狀態管理: Zustand
- Markdown 文件渲染: react-markdown + remark-gfm
- 建構工具: Vite 7

## 快速開始

### 安裝環境

確保您的開發環境已安裝 Node.js (建議 v20 以上)。

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

開發伺服器預設為 http://localhost:3000

## 構建生產版本

```bash
npm run build
```

建置完成後，輸出檔案位於 dist 目錄。

## 專案架構摘要

- src/pages/signin: 身份驗證中心（登入/註冊/OAuth 流程）。
- src/pages/app-shell: 受保護的應用區域（Dashboard、歷史資料、API Keys）。
- src/service/api.ts: API 請求封裝、ApiError、Token refresh 邏輯。
- src/service/user_auth.service.ts: 使用者認證狀態與持久化管理。
- src/share: 共用導覽元件（public-nav、signin-nav）。

## 部署提醒

若使用 Nginx 或 Nginx Proxy Manager，請確保 SPA fallback 設定正確：

```nginx
location / {
  try_files $uri /index.html;
}
```

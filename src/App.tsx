import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 表網站組件 (保持同步載入，因為是首頁)
import Home from './pages/home/home';
import Signin from './pages/signin/signin';
import About from './pages/introductions/about/about';
import Features from './pages/introductions/features/features';
import Docs from './pages/introductions/terms_docs/docs';
import ProtectedRoute from './components/ProtectedRoute';

// OAuth 回呼頁面 (延遲載入)
const OAuthCallback = lazy(() => import('./pages/signin/oauth-callback/oauth-callback'));

// 裡網站組件 (延遲載入：只有進到該頁面才會下載程式碼，優化效能)
// const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
// const MatchHistory = lazy(() => import('./pages/dashboard/MatchHistory'));
// const Analysis = lazy(() => import('./pages/dashboard/Analysis'));

function App() {
  return (
    <BrowserRouter>
      {/* 使用 Suspense 包裹 lazy 元件，顯示載入中的狀態 */}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* --- 公開路由 (表網站) --- */}
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/features" element={<Features />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* --- 受保護路由 (裡網站) --- */}
          {/* 只有登入後才能進入 /app 開頭的路由 */}
          {/* <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<MatchHistory />} />
            <Route path="/analysis" element={<Analysis />} />
          </Route> */}

          {/* 404 處理 */}
          <Route path="*" element={<div>頁面不存在</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
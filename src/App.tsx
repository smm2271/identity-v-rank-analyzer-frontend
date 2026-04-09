import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// 表網站組件 (保持同步載入，因為是首頁)
import Home from './pages/home/home';
import Signin from './pages/signin/signin';
import About from './pages/introductions/about/about';
import Features from './pages/introductions/features/features';
import Docs from './pages/introductions/terms_docs/docs';
import ProtectedRoute from './components/ProtectedRoute';

// OAuth 回呼頁面 (延遲載入)
const OAuthCallback = lazy(() => import('./pages/signin/oauth-callback/oauth-callback'));
const CompleteProfile = lazy(() => import('./pages/signin/complete-profile/complete-profile'));
const LinkIdentity = lazy(() => import('./pages/signin/link-identity/link-identity'));
const DashboardShell = lazy(() => import('./pages/app-shell/dashboard-shell'));
const DashboardOverviewPage = lazy(() => import('./pages/app-shell/dashboard-overview/dashboard-overview'));
const MatchHistoryPage = lazy(() => import('./pages/app-shell/match-history/match-history'));

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
          <Route path="/signin/complete-profile" element={<CompleteProfile />} />
          <Route path="/signin/link-identity" element={<LinkIdentity />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* --- 受保護路由 (裡網站) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<DashboardShell />}>
              <Route index element={<Navigate to="history" replace />} />
              <Route path="history" element={<MatchHistoryPage />} />
            </Route>
          </Route>

          {/* 404 處理 */}
          <Route path="*" element={<div>頁面不存在</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // 這裡檢查是否存在 Token，通常存放在 localStorage 或 Cookie 中
    const token = localStorage.getItem('user_token');

    // 如果沒有 Token，就重新導向到登入頁面
    return token ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;
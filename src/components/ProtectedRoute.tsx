import { Navigate, Outlet } from 'react-router-dom';
import { useUserAuthStore } from '../service/user_auth.service';

const ProtectedRoute = () => {
    const isAuthenticated = useUserAuthStore((s) => s.isAuthenticated);

    // 如果沒有登入，就重新導向到登入頁面
    return isAuthenticated ? <Outlet /> : <Navigate to="/signin?type=login" replace />;
};

export default ProtectedRoute;
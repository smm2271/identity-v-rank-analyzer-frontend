import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../service/auth.service";
import { useUserAuthStore } from "../../service/user_auth.service";
import AppNav from "../../share/app-nav/app-nav";
import styles from "./dashboard-shell.module.css";

export default function DashboardShell() {
    const navigate = useNavigate();
    const username = useUserAuthStore((state) => state.username);
    const accessToken = useUserAuthStore((state) => state.accessToken);
    const clearAuth = useUserAuthStore((state) => state.clearAuth);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    async function handleLogout() {
        try {
            if (accessToken) {
                await logout(accessToken);
            }
        } catch {
            // 登出 API 失敗時仍清除本地登入態，避免卡住頁面。
        } finally {
            clearAuth();
            navigate("/signin?type=login", { replace: true });
        }
    }

    function closeSidebarOnNavigate() {
        setSidebarOpen(false);
    }

    return (
        <div className={`${styles.shell} ${sidebarOpen ? styles.shellOpen : ""}`}>
            <AppNav
                sidebarOpen={sidebarOpen}
                onCloseSidebar={closeSidebarOnNavigate}
                username={username}
                onLogout={handleLogout}
            />

            <main className={styles.main}>
                <header className={styles.topbar}>
                    <button
                        type="button"
                        className={styles.hamburger}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <h1>對戰紀錄中心</h1>
                    <p>整合你的每一場對局，建立可追蹤的進步曲線。</p>
                </header>
                <section className={styles.content}>
                    <Outlet />
                </section>
            </main>
        </div>
    );
}

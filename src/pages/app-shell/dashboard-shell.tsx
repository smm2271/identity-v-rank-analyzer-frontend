import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../service/auth.service";
import { useUserAuthStore } from "../../service/user_auth.service";
import styles from "./dashboard-shell.module.css";

export default function DashboardShell() {
    const navigate = useNavigate();
    const username = useUserAuthStore((state) => state.username);
    const accessToken = useUserAuthStore((state) => state.accessToken);
    const clearAuth = useUserAuthStore((state) => state.clearAuth);

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

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <span className={styles.brandBadge}>IV</span>
                    <div>
                        <p className={styles.brandTitle}>Hunter Console</p>
                        <p className={styles.brandHint}>Week 9 / 內站</p>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <NavLink
                        to="/app/history"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    >
                        歷史戰績
                    </NavLink>
                    <span className={`${styles.navItem} ${styles.navItemMuted}`}>分析中心（規劃中）</span>
                </nav>

                <div className={styles.sidebarBottom}>
                    <p className={styles.userLabel}>登入身分</p>
                    <p className={styles.username}>{username ?? "未命名使用者"}</p>
                    <button type="button" className={styles.signOut} onClick={handleLogout}>
                        登出
                    </button>
                </div>
            </aside>

            <main className={styles.main}>
                <header className={styles.topbar}>
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

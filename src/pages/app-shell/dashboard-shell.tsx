import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../service/auth.service";
import { useUserAuthStore } from "../../service/user_auth.service";
import styles from "./dashboard-shell.module.css";

export default function DashboardShell() {
    const navigate = useNavigate();
    const location = useLocation();
    const username = useUserAuthStore((state) => state.username);
    const accessToken = useUserAuthStore((state) => state.accessToken);
    const clearAuth = useUserAuthStore((state) => state.clearAuth);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [analysisMenuOpen, setAnalysisMenuOpen] = useState(false);

    const analysisView = new URLSearchParams(location.search).get("view");
    const isAnalysisPath = location.pathname.startsWith("/app/analysis");

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

    function getAnalysisSubmenuItemClass(view: string) {
        return `${styles.submenuItem} ${analysisView === view ? styles.submenuItemActive : ""}`;
    }

    return (
        <div className={`${styles.shell} ${sidebarOpen ? styles.shellOpen : ""}`}>
            {sidebarOpen && (
                <button
                    type="button"
                    className={styles.backdrop}
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                />
            )}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.brand}>
                    <span className={styles.brandBadge}>IDV</span>
                    <div>
                        <p className={styles.brandTitle}>對戰紀錄中心</p>
                        <p className={styles.brandHint}>戰鬥基地</p>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <NavLink
                        to="/app/dashboard"
                        onClick={closeSidebarOnNavigate}
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    >
                        總儀表板
                    </NavLink>
                    <NavLink
                        to="/app/history"
                        onClick={closeSidebarOnNavigate}
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    >
                        歷史戰績
                    </NavLink>
                    <NavLink
                        to="/app/api-keys"
                        onClick={closeSidebarOnNavigate}
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    >
                        API Keys
                    </NavLink>

                    <div
                        className={`${styles.navGroup} ${analysisMenuOpen ? styles.navGroupOpen : ""}`}
                        onMouseEnter={() => setAnalysisMenuOpen(true)}
                        onMouseLeave={() => setAnalysisMenuOpen(false)}
                    >
                        <div className={styles.navGroupHeader}>
                            <NavLink
                                to="/app/analysis"
                                onClick={closeSidebarOnNavigate}
                                className={`${styles.navItem} ${styles.navGroupLink} ${isAnalysisPath ? styles.navItemActive : ""}`}
                            >
                                分析中心
                            </NavLink>
                            <button
                                type="button"
                                className={styles.navExpandButton}
                                onClick={() => setAnalysisMenuOpen((prev) => !prev)}
                                aria-label="Toggle analysis submenu"
                                aria-expanded={analysisMenuOpen}
                            >
                                ▾
                            </button>
                        </div>

                        <div className={styles.submenu}>
                            <Link
                                to="/app/analysis?view=role-scores"
                                onClick={closeSidebarOnNavigate}
                                className={getAnalysisSubmenuItemClass("role-scores")}
                            >
                                所有角色認知分
                            </Link>
                            <Link
                                to="/app/analysis?view=lineup-analysis"
                                onClick={closeSidebarOnNavigate}
                                className={getAnalysisSubmenuItemClass("lineup-analysis")}
                            >
                                陣容相剋與搭配
                            </Link>
                            <Link
                                to="/app/analysis?view=map-character"
                                onClick={closeSidebarOnNavigate}
                                className={getAnalysisSubmenuItemClass("map-character")}
                            >
                                地圖 x 角色交叉
                            </Link>
                        </div>
                    </div>
                </nav>

                <div className={styles.sidebarBottom}>
                    <p className={styles.userLabel}>登入身分</p>
                    <p className={styles.username}>{username ?? "未命名使用者"}</p>
                    <a href="/" className={styles.homeLink}>← 回到首頁</a>
                    <button type="button" className={styles.signOut} onClick={handleLogout}>
                        登出
                    </button>
                </div>
            </aside>

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

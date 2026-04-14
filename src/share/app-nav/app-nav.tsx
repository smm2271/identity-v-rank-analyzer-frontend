import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import styles from "./app-nav.module.css";

type AppNavProps = {
    sidebarOpen: boolean;
    onCloseSidebar: () => void;
    username: string | null;
    onLogout: () => void;
};

export default function AppNav({ sidebarOpen, onCloseSidebar, username, onLogout }: AppNavProps) {
    const location = useLocation();
    const [analysisMenuOpen, setAnalysisMenuOpen] = useState(false);

    const analysisView = new URLSearchParams(location.search).get("view");
    const isAnalysisPath = location.pathname.startsWith("/app/analysis");

    function getAnalysisSubmenuItemClass(view: string) {
        return `${styles.submenuItem} ${analysisView === view ? styles.submenuItemActive : ""}`;
    }

    return (
        <>
            {sidebarOpen && (
                <button
                    type="button"
                    className={styles.backdrop}
                    onClick={onCloseSidebar}
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
                        onClick={onCloseSidebar}
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    >
                        總儀表板
                    </NavLink>
                    <NavLink
                        to="/app/history"
                        onClick={onCloseSidebar}
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    >
                        歷史戰績
                    </NavLink>
                    <NavLink
                        to="/app/api-keys"
                        onClick={onCloseSidebar}
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    >
                        API Keys
                    </NavLink>

                    <div
                        className={`${styles.navGroup} ${analysisMenuOpen ? styles.navGroupOpen : ""}`}
                    >
                        <div className={styles.navGroupHeader}>
                            <NavLink
                                to="/app/analysis"
                                onClick={onCloseSidebar}
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
                                onClick={onCloseSidebar}
                                className={getAnalysisSubmenuItemClass("role-scores")}
                            >
                                所有角色認知分
                            </Link>
                            <Link
                                to="/app/analysis?view=lineup-analysis"
                                onClick={onCloseSidebar}
                                className={getAnalysisSubmenuItemClass("lineup-analysis")}
                            >
                                陣容相剋與搭配
                            </Link>
                            <Link
                                to="/app/analysis?view=map-character"
                                onClick={onCloseSidebar}
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
                    <button type="button" className={styles.signOut} onClick={onLogout}>
                        登出
                    </button>
                </div>
            </aside>
        </>
    );
}

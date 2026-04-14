import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import styles from './public-nav.module.css';
import { logout } from '../../service/auth.service';
import { useUserAuthStore } from '../../service/user_auth.service';

const INTRODUCTION_ITEMS = [
  { key: 'features', to: '/features', label: '功能介紹' },
  { key: 'terms', to: { pathname: '/docs', search: '?doc=terms' }, label: '使用條款' },
  { key: 'about', to: '/about', label: '關於計畫' },
];

const GUEST_ITEMS = [
  {
    key: 'login',
    to: { pathname: '/signin', search: '?type=login' },
    label: '登入',
    className: 'loginBtn',
  },
  {
    key: 'register',
    to: { pathname: '/signin', search: '?type=register' },
    label: '註冊',
    className: 'registerBtn',
  },
];

export default function PublicNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const navigate = useNavigate();
  const token = useUserAuthStore((state) => state.accessToken);
  const username = useUserAuthStore((state) => state.username);
  const clearAuth = useUserAuthStore((state) => state.clearAuth);
  const signedIn = Boolean(token && username);

  const collapseAllMenus = () => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  };

  async function handleLogout() {
    setIsAccountOpen(false);
    setIsMenuOpen(false);

    if (token) {
      try {
        await logout(token);
      } catch {
        // 登出以本地狀態清除為主，伺服器失敗時仍讓使用者離線
      }
    }

    clearAuth();
    navigate('/signin?type=login', { replace: true });
  }

  return (
    <header className={styles.publicNav}>
      {isMenuOpen && (
        <button
          type="button"
          className={styles.mobileMask}
          onClick={collapseAllMenus}
          aria-label="關閉選單"
        />
      )}

      <div className={styles.navFrame}>
        <div className={styles.brandRow}>
          <Link to="/" className={styles.brandLink} onClick={collapseAllMenus}>
            <h1>第五人格分析小工具</h1>
          </Link>
          <button
            type="button"
            className={`${styles.burger} ${isMenuOpen ? styles.burgerOpen : ''}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="切換選單"
            aria-expanded={isMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`${styles.navBody} ${isMenuOpen ? styles.open : ''}`}>
          <nav className={styles.primaryRail} aria-label="Public navigation">
            {INTRODUCTION_ITEMS.map((item) => (
              <NavLink key={item.key} to={item.to} onClick={collapseAllMenus}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.actionRail}>
            {signedIn ? (
              <div className={styles.accountMenu}>
                <button
                  type="button"
                  className={styles.accountButton}
                  onClick={() => setIsAccountOpen((prev) => !prev)}
                  aria-expanded={isAccountOpen}
                >
                  <span className={styles.accountGreeting}>歡迎，{username}</span>
                  <span className={styles.accountCaret} aria-hidden="true">▾</span>
                </button>

                {isAccountOpen && (
                  <div className={styles.accountDropdown}>
                    <Link to="/app/dashboard" className={styles.enterAppButton} onClick={collapseAllMenus}>
                      進入基地
                    </Link>
                    <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                      登出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              GUEST_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  className={styles[item.className]}
                  onClick={collapseAllMenus}
                >
                  {item.label}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
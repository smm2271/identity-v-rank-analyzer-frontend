import { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import styles from './public-nav.module.css';
import { logout } from '../../service/auth.service';
import { useUserAuthStore } from '../../service/user_auth.service';

export default function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const accessToken = useUserAuthStore((state) => state.accessToken);
  const username = useUserAuthStore((state) => state.username);
  const clearAuth = useUserAuthStore((state) => state.clearAuth);
  const isSignedIn = Boolean(accessToken && username);

  const introLinks = useMemo(
    () => [
      { to: '/features', label: '功能介紹' },
      { to: { pathname: '/docs', search: '?doc=terms' }, label: '使用條款' },
      { to: '/about', label: '關於計畫' },
    ],
    [],
  );

  const authLinks = useMemo(
    () => [
      { to: { pathname: '/signin', search: '?type=login' }, label: '登入', className: styles.loginBtn },
      { to: { pathname: '/signin', search: '?type=register' }, label: '註冊', className: styles.registerBtn },
    ],
    [],
  );

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  function closeMobileMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    setAccountMenuOpen(false);
    setMenuOpen(false);

    if (accessToken) {
      try {
        await logout(accessToken);
      } catch {
        // 登出以本地狀態清除為主，伺服器失敗時仍讓使用者離線
      }
    }

    clearAuth();
    navigate('/signin?type=login', { replace: true });
  }

  function handleAccountToggle() {
    setAccountMenuOpen((prev) => !prev);
  }

  return (
    <div className={styles.publicNav}>
      <div className={styles.brandRow}>
        <Link to="/" onClick={closeMobileMenu}>
          <h1>第五人格戰積記錄分析小工具</h1>
        </Link>
        <button
          type="button"
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
          onClick={toggleMenu}
          aria-label="切換選單"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.introductionBtns}>
          {introLinks.map((item) => (
            <NavLink key={item.label} to={item.to} onClick={closeMobileMenu}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className={styles.loginSignInBtns}>
          {isSignedIn ? (
            <div className={styles.accountMenu}>
              <button
                type="button"
                className={styles.accountButton}
                onClick={handleAccountToggle}
                aria-expanded={accountMenuOpen}
              >
                <span className={styles.accountGreeting}>歡迎，{username}</span>
                <span className={styles.accountCaret} aria-hidden="true">▾</span>
              </button>
              {accountMenuOpen && (
                <div className={styles.accountDropdown}>
                  <Link
                    to="/app/dashboard"
                    className={styles.enterAppButton}
                    onClick={() => {
                      setAccountMenuOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    進入基地
                  </Link>
                  <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                    登出
                  </button>
                </div>
              )}
            </div>
          ) : (
            authLinks.map((item) => (
              <Link key={item.label} to={item.to} className={item.className} onClick={closeMobileMenu}>
                {item.label}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
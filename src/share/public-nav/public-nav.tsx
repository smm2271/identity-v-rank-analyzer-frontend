import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import styles from './public-nav.module.css';
import { logout } from '../../service/auth.service';
import { useUserAuthStore } from '../../service/user_auth.service';

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const accessToken = useUserAuthStore((state) => state.accessToken);
  const username = useUserAuthStore((state) => state.username);
  const clearAuth = useUserAuthStore((state) => state.clearAuth);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  async function handleLogout() {
    setAccountMenuOpen(false);

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

  return (
    <div className={styles.publicNav}>
      <div className={styles.brandRow}>
        <Link to="/" onClick={close}><h1>第五人格分析小工具</h1></Link>
        <button
          type="button"
          className={`${styles.burger} ${open ? styles.burgerOpen : ''}`}
          onClick={toggle}
          aria-label="切換選單"
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`${styles.navLinks} ${open ? styles.open : ''}`}>
        <div className={styles.introductionBtns}>
          <NavLink to="/features" onClick={close}>功能介紹</NavLink>
          <NavLink to={{ pathname: '/docs', search: '?doc=terms' }} onClick={close}>使用條款</NavLink>
          <NavLink to="/about" onClick={close}>關於計畫</NavLink>
        </div>

        <div className={styles.loginSignInBtns}>
          {accessToken && username ? (
            <div className={styles.accountMenu}>
              <button
                type="button"
                className={styles.accountButton}
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
              >
                <span className={styles.accountGreeting}>歡迎，{username}</span>
                <span className={styles.accountCaret} aria-hidden="true">▾</span>
              </button>
              {accountMenuOpen && (
                <div className={styles.accountDropdown}>
                  <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                    登出
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to={{ pathname: '/signin', search: '?type=login' }} className={styles.loginBtn} onClick={close}>登入</Link>
              <Link to={{ pathname: '/signin', search: '?type=register' }} className={styles.registerBtn} onClick={close}>註冊</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
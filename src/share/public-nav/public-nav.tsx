import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import styles from './public-nav.module.css';

export default function PublicNav() {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

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
          <Link to={{ pathname: '/signin', search: '?type=login' }} className={styles.loginBtn} onClick={close}>登入</Link>
          <Link to={{ pathname: '/signin', search: '?type=register' }} className={styles.registerBtn} onClick={close}>註冊</Link>
        </div>
      </div>
    </div>
  );
}
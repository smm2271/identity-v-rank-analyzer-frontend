import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import styles from './public-nav.module.css';

export default function PublicNav() {
  return (
    <div className={styles.publicNav}>
      <div>
        <h1>第五人格分析小工具</h1>
      </div>
      <div className={styles.introductionBtns}>
        <NavLink to="/features">功能介紹</NavLink>
        <NavLink to="/dashboard">儀表板展示</NavLink>
        <NavLink to="/terms">使用條款</NavLink>
        <NavLink to="/about">關於計畫</NavLink>
      </div>
      <div className={styles.loginSignInBtns}>
        <Link to={{ pathname: "/signin", search: "?type=login" }} className={styles.loginBtn}>登入</Link>
        <Link to={{ pathname: "/signin", search: "?type=register" }} className={styles.registerBtn}>註冊</Link>
      </div>
    </div>
  );
}
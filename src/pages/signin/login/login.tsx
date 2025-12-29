import styles from "./login.module.css";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    return (
        <div className={styles.loginForm}>
            <h1>登入基地</h1>
            <p>歡迎回到備戰基地</p>
            <form>
                <label htmlFor="username">電子郵件或使用者名稱</label>
                <input type="text" placeholder="user@example.com" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />

                <div className={styles.pwdtxt}>
                    <label htmlFor="password">密碼</label>
                    <Link to="?type=forgetPassword">忘記密碼</Link>
                </div>
                <input type="password" placeholder="密碼" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button>登入</button>
            </form>
        </div>
    );
}
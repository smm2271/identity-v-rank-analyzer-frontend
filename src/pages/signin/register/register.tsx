import styles from "./register.module.css";
import { useState } from "react";

export default function Register() {
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [checkPassword, setCheckPassword] = useState("");
    const [tosChecked, setTosChecked] = useState(false);
    return (
        <div className={styles.registerForm}>
            <h1>加入基地</h1>
            <p>歡迎使用本基地</p>
            <form>
                <label htmlFor="email">電子郵件</label>
                <div className={styles.inputContainer}>
                    <input type="text" placeholder="user@example.com" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <i className="fa-solid fa-user"></i>
                </div>

                <label htmlFor="user_id">名稱</label>
                <div className={styles.inputContainer}>
                    <input type="text" placeholder="User Name" id="user_id" value={userId} onChange={(e) => setUserId(e.target.value)} />
                    <i className="fa-solid fa-user"></i>
                </div>

                <label htmlFor="password">密碼</label>
                <div className={styles.inputContainer}>
                    <input type="password" placeholder="Password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <i className="fa-solid fa-lock"></i>
                </div>

                <label htmlFor="checkpassword">確認密碼</label>
                <div className={styles.inputContainer}>
                    <input type="password" placeholder="Confirm Password" id="checkpassword" value={checkPassword} onChange={(e) => setCheckPassword(e.target.value)} />
                    <i className="fa-solid fa-lock"></i>
                </div>

                <div className={styles.checktos}>
                    <input type="checkbox" id="tos" checked={tosChecked} onChange={(e) => setTosChecked(e.target.checked)} />
                    <label htmlFor="tos">
                        我已閱讀並同意 <a href="/docs?doc=tos">服務條款</a> 及 <a href="/docs?doc=privacy">隱私政策</a>
                    </label>
                </div>
                <button>立即註冊</button>
            </form>
        </div>
    );
}
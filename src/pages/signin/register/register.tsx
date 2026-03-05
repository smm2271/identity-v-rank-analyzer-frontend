import styles from "./register.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../../service/auth.service";
import { useUserAuthStore } from "../../../service/user_auth.service";
import { ApiError } from "../../../service/api";

export default function Register() {
    const navigate = useNavigate();
    const setTokens = useUserAuthStore((s) => s.setTokens);

    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [checkPassword, setCheckPassword] = useState("");
    const [tosChecked, setTosChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // 前端驗證
        if (password !== checkPassword) {
            setError("密碼與確認密碼不一致");
            return;
        }
        if (!tosChecked) {
            setError("請先同意服務條款及隱私政策");
            return;
        }

        setLoading(true);
        try {
            const tokens = await register(email, password, userId || undefined);
            setTokens(tokens.access_token, tokens.refresh_token);
            navigate("/", { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("註冊時發生未知錯誤，請稍後再試");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.registerForm}>
            <h1>加入基地</h1>
            <p>歡迎使用本基地</p>
            <form onSubmit={handleSubmit}>
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
                        我已閱讀並同意 <a href="/docs?doc=terms">服務條款</a> 及 <a href="/docs?doc=privacy">隱私政策</a>
                    </label>
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "註冊中…" : "立即註冊"}
                </button>
            </form>
        </div>
    );
}
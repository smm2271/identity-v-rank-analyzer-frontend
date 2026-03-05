import styles from "./login.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "../../../service/auth.service";
import { useUserAuthStore } from "../../../service/user_auth.service";
import { ApiError } from "../../../service/api";

export default function Login() {
    const navigate = useNavigate();
    const setTokens = useUserAuthStore((s) => s.setTokens);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const tokens = await login(username, password);
            setTokens(tokens.access_token, tokens.refresh_token);
            navigate("/", { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("登入時發生未知錯誤，請稍後再試");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.loginForm}>
            <h1>登入基地</h1>
            <p>歡迎回到備戰基地</p>
            <form onSubmit={handleSubmit}>
                <label htmlFor="username">電子郵件或使用者名稱</label>
                <div className={styles.inputContainer}>
                    <input type="text" placeholder="user@example.com" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <i className="fa-solid fa-user"></i>
                </div>

                <div className={styles.pwdtxt}>
                    <label htmlFor="password">密碼</label>
                    <Link to="?type=forgetPassword">忘記密碼</Link>
                </div>
                <div className={styles.inputContainer}>
                    <input type={showPassword ? "text" : "password"} placeholder="密碼" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <i className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} onClick={() => setShowPassword(!showPassword)}></i>
                </div>

                <div className={styles.rememberContainer}>
                    <input type="checkbox" name="remember" id="remember" />
                    <label htmlFor="remember">保持登入狀態</label>
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "登入中…" : "立即登入"}
                </button>
            </form>
        </div>
    );
}
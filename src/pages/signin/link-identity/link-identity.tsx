import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SigninNav from "../../../share/signin-nav/signin-nav";
import { linkIdentity } from "../../../service/auth.service";
import { ApiError } from "../../../service/api";
import { useUserAuthStore } from "../../../service/user_auth.service";
import styles from "../oauth-flow/oauth-flow.module.css";

export default function LinkIdentity() {
    const navigate = useNavigate();
    const setAccessToken = useUserAuthStore((state) => state.setAccessToken);

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const linkToken = sessionStorage.getItem("oauth_link_token");
    const oauthEmail = sessionStorage.getItem("oauth_link_email");
    const oauthProvider = sessionStorage.getItem("oauth_link_provider");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!linkToken) {
            setError("找不到 OAuth 關聯資訊，請重新登入");
            return;
        }
        if (!identifier.trim() || !password) {
            setError("請輸入原帳號與密碼");
            return;
        }

        setLoading(true);
        try {
            const tokens = await linkIdentity(linkToken, identifier.trim(), password);
            sessionStorage.removeItem("oauth_link_token");
            sessionStorage.removeItem("oauth_link_email");
            sessionStorage.removeItem("oauth_link_provider");
            setAccessToken(tokens.access_token, tokens.user.username);
            navigate("/app/history", { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("關聯帳號時發生未知錯誤，請稍後再試");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.flowPage}>
            <SigninNav />
            <div className={styles.flowShell}>
                <div className={styles.flowCard}>
                    <h1 className={styles.flowTitle}>關聯帳號</h1>
                    <p className={styles.flowSubtitle}>請先登入你的原帳號，系統會把目前的 OAuth 身分綁定到該帳號。</p>
                    {oauthEmail && <p className={styles.flowMeta}>OAuth Email: {oauthEmail}</p>}
                    {oauthProvider && <p className={styles.flowMeta}>登入供應商: {oauthProvider}</p>}
                    <form className={styles.flowForm} onSubmit={handleSubmit}>
                        <div className={styles.flowField}>
                            <label htmlFor="identifier">電子郵件或使用者名稱</label>
                            <input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(event) => setIdentifier(event.target.value)}
                                placeholder="原帳號的電子郵件或使用者名稱"
                            />
                        </div>
                        <div className={styles.flowField}>
                            <label htmlFor="password">密碼</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="原帳號密碼"
                            />
                        </div>
                        {error && <p className={styles.flowError}>{error}</p>}
                        <div className={styles.flowActions}>
                            <button type="submit" className={styles.flowButton} disabled={loading}>
                                {loading ? "處理中…" : "完成關聯"}
                            </button>
                            <Link to="/signin?type=login" className={styles.flowLink}>
                                返回登入頁面
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SigninNav from "../../../share/signin-nav/signin-nav";
import { oauthFinalize } from "../../../service/auth.service";
import { ApiError } from "../../../service/api";
import { useUserAuthStore } from "../../../service/user_auth.service";
import styles from "../oauth-flow/oauth-flow.module.css";

export default function CompleteProfile() {
    const navigate = useNavigate();
    const setAccessToken = useUserAuthStore((state) => state.setAccessToken);

    const [username, setUsername] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registrationToken = sessionStorage.getItem("oauth_registration_token");
    const oauthEmail = sessionStorage.getItem("oauth_registration_email");
    const oauthProvider = sessionStorage.getItem("oauth_registration_provider");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!registrationToken) {
            setError("找不到 OAuth 註冊資訊，請重新登入");
            return;
        }
        if (!username.trim()) {
            setError("請輸入使用者名稱");
            return;
        }
        if (!termsAccepted) {
            setError("請先同意服務條款及隱私政策");
            return;
        }

        setLoading(true);
        try {
            const tokens = await oauthFinalize(registrationToken, username.trim(), termsAccepted);
            sessionStorage.removeItem("oauth_registration_token");
            sessionStorage.removeItem("oauth_registration_email");
            sessionStorage.removeItem("oauth_registration_provider");
            setAccessToken(tokens.access_token, tokens.user.username);
            navigate("/app/history", { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("完成註冊時發生未知錯誤，請稍後再試");
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
                    <h1 className={styles.flowTitle}>完成註冊</h1>
                    <p className={styles.flowSubtitle}>請設定使用者名稱並確認服務條款，完成 OAuth 新帳號建立。</p>
                    {oauthEmail && <p className={styles.flowMeta}>OAuth Email: {oauthEmail}</p>}
                    {oauthProvider && <p className={styles.flowMeta}>登入供應商: {oauthProvider}</p>}
                    <form className={styles.flowForm} onSubmit={handleSubmit}>
                        <div className={styles.flowField}>
                            <label htmlFor="username">使用者名稱</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="請輸入使用者名稱"
                            />
                        </div>
                        <label className={styles.checkboxRow} htmlFor="termsAccepted">
                            <input
                                id="termsAccepted"
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(event) => setTermsAccepted(event.target.checked)}
                            />
                            我已閱讀並同意 <a href="/docs?doc=terms">服務條款</a> 及 <a href="/docs?doc=privacy">隱私政策</a>
                        </label>
                        {error && <p className={styles.flowError}>{error}</p>}
                        <div className={styles.flowActions}>
                            <button type="submit" className={styles.flowButton} disabled={loading}>
                                {loading ? "處理中…" : "完成註冊"}
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

import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import SigninNav from "../../../share/signin-nav/signin-nav";
import { getOAuthAuthorizeUrl, linkIdentity } from "../../../service/auth.service";
import { ApiError } from "../../../service/api";
import { useUserAuthStore } from "../../../service/user_auth.service";
import styles from "../oauth-flow/oauth-flow.module.css";

const OAUTH_CALLBACK_PATH = "/auth/callback";

export default function LinkIdentity() {
    const navigate = useNavigate();
    const setAccessToken = useUserAuthStore((s) => s.setAccessToken);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [identifier, setIdentifier] = useState(() => sessionStorage.getItem("oauth_link_email") ?? "");
    const [password, setPassword] = useState("");

    const linkToken = sessionStorage.getItem("oauth_link_token");
    const oauthEmail = sessionStorage.getItem("oauth_link_email");
    const oauthProvider = sessionStorage.getItem("oauth_link_provider");
    const verificationProviders = useMemo(() => {
        const raw = sessionStorage.getItem("oauth_link_verification_providers");
        if (!raw) {
            return [] as string[];
        }

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [] as string[];
            }
            return parsed.filter((provider): provider is string => typeof provider === "string");
        } catch {
            return [] as string[];
        }
    }, []);

    async function handlePasswordLink(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!linkToken) {
            setError("找不到 OAuth 關聯資訊，請重新登入");
            return;
        }
        if (!identifier.trim()) {
            setError("請輸入原帳號 Email 或使用者名稱");
            return;
        }
        if (!password) {
            setError("請輸入原帳號密碼");
            return;
        }

        setLoading(true);
        try {
            const tokens = await linkIdentity(linkToken, identifier.trim(), password);
            sessionStorage.removeItem("oauth_link_token");
            sessionStorage.removeItem("oauth_link_email");
            sessionStorage.removeItem("oauth_link_provider");
            sessionStorage.removeItem("oauth_link_verification_providers");
            setAccessToken(tokens.access_token, tokens.user.username);
            navigate("/app/dashboard", { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("無法完成帳號關聯，請稍後再試");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleProviderVerify(provider: string) {
        setError(null);

        if (!linkToken) {
            setError("找不到 OAuth 關聯資訊，請重新登入");
            return;
        }
        if (!provider) {
            setError("請選擇一個驗證供應商");
            return;
        }

        setLoading(true);
        try {
            const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
            const { authorization_url, state } = await getOAuthAuthorizeUrl(provider, redirectUri);

            sessionStorage.setItem("oauth_state", state);
            sessionStorage.setItem("oauth_provider", provider);
            sessionStorage.setItem("oauth_redirect_uri", redirectUri);
            sessionStorage.setItem("oauth_link_verification_mode", "1");

            window.location.href = authorization_url;
        } catch (err) {
            setLoading(false);
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("無法啟動驗證流程，請稍後再試");
            }
        }
    }

    return (
        <div className={styles.flowPage}>
            <SigninNav />
            <div className={styles.flowShell}>
                <div className={styles.flowCard}>
                    <h1 className={styles.flowTitle}>關聯帳號</h1>
                    <p className={styles.flowSubtitle}>請先驗證原本的帳號身分，完成後才會關聯目前 OAuth 身分。你可以使用既有第三方帳號，或直接輸入原帳號密碼。</p>
                    {oauthEmail && <p className={styles.flowMeta}>OAuth Email: {oauthEmail}</p>}
                    {oauthProvider && <p className={styles.flowMeta}>登入供應商: {oauthProvider}</p>}
                    <div className={styles.flowForm}>
                        {verificationProviders.length > 0 ? (
                            <>
                                <p className={styles.flowMeta}>可用驗證方式：</p>
                                <div className={styles.flowActions}>
                                    {verificationProviders.map((provider) => (
                                        <button
                                            key={provider}
                                            type="button"
                                            className={styles.flowButton}
                                            disabled={loading}
                                            onClick={() => handleProviderVerify(provider)}
                                        >
                                            {loading ? "處理中…" : `使用 ${provider} 驗證並關聯`}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : null}

                        <form className={styles.flowForm} onSubmit={handlePasswordLink}>
                            <p className={styles.flowMeta}>或使用原帳號密碼驗證</p>
                            <div className={styles.flowField}>
                                <label htmlFor="link-identifier">Email / 使用者名稱</label>
                                <input
                                    id="link-identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(event) => setIdentifier(event.target.value)}
                                    autoComplete="username"
                                    placeholder="輸入原帳號 Email 或使用者名稱"
                                />
                            </div>
                            <div className={styles.flowField}>
                                <label htmlFor="link-password">密碼</label>
                                <input
                                    id="link-password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="current-password"
                                    placeholder="輸入原帳號密碼"
                                />
                            </div>
                            <button type="submit" className={styles.flowButton} disabled={loading}>
                                {loading ? "處理中…" : "以密碼驗證並關聯"}
                            </button>
                        </form>

                        {error && <p className={styles.flowError}>{error}</p>}

                        <div className={styles.flowActions}>
                            <Link to="/signin?type=login" className={styles.flowLink}>
                                返回登入頁面
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

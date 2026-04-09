import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SigninNav from "../../../share/signin-nav/signin-nav";
import { getOAuthAuthorizeUrl } from "../../../service/auth.service";
import { ApiError } from "../../../service/api";
import styles from "../oauth-flow/oauth-flow.module.css";

const OAUTH_CALLBACK_PATH = "/auth/callback";

export default function LinkIdentity() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                    <p className={styles.flowSubtitle}>請使用原本已綁定的第三方帳號登入，完成身分驗證後才會關聯目前 OAuth 身分。</p>
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
                        ) : (
                            <p className={styles.flowError}>找不到可用的第三方驗證方式，請聯絡管理員協助。</p>
                        )}

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

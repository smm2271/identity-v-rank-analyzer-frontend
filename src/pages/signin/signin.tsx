import { useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import SigninNav from "../../share/signin-nav/signin-nav";
import styles from "./signin.module.css";
import Login from "./login/login";
import Register from "./register/register";
import { getOAuthAuthorizeUrl } from "../../service/auth.service";
import { ApiError } from "../../service/api";

/** 前端 OAuth 回呼路徑 */
const OAUTH_CALLBACK_PATH = "/auth/callback";

export default function Signin() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get("type");

    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [oauthError, setOauthError] = useState<string | null>(null);

    async function handleOAuthLogin(provider: string) {
        setOauthLoading(provider);
        setOauthError(null);

        try {
            const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
            const { authorization_url, state } = await getOAuthAuthorizeUrl(provider, redirectUri);

            // 將 state、provider、redirect_uri 暫存到 sessionStorage（供 callback 頁面驗證用）
            sessionStorage.setItem("oauth_state", state);
            sessionStorage.setItem("oauth_provider", provider);
            sessionStorage.setItem("oauth_redirect_uri", redirectUri);

            // 導向 OAuth 供應商授權頁面
            window.location.href = authorization_url;
        } catch (err) {
            setOauthLoading(null);
            if (err instanceof ApiError) {
                setOauthError(err.detail);
            } else {
                setOauthError("無法取得授權連結，請稍後再試");
            }
        }
    }

    return (
        <div className={styles.signinPageContainer}>
            <SigninNav />
            <div className={styles.mainContainer}>
                <div className={styles.introductionContainer}>
                    <div>
                        <p className={styles.version}>v1.0.0 測試版</p>
                        <h1>
                            第五人格分析小工具
                        </h1>
                        <p>從角色勝率到BP選擇。</p>
                        <p>千場對局，逐步分析，讓你看見個人趨勢。</p>
                    </div>
                </div>
                <div className={styles.signinContainer}>
                    <div className={styles.signinFormContainer}>
                        <div className={styles.signinFormSwitchContainer}>
                            <Link to="?type=login" className={(type === "login") ? styles.active : ""}>登入</Link>
                            <Link to="?type=register" className={(type === "register") ? styles.active : ""}>註冊</Link>
                        </div>
                        <div className={styles.signinFormContentContainer}>
                            {type === "login" && <Login />}
                            {type === "register" && <Register />}
                        </div>
                        <div className={styles.orContainer}>
                            <p>或</p>
                        </div>
                        <div className={styles.oAuthButtonContainer}>
                            <button
                                className={styles.oAuthButtonDiscord}
                                onClick={() => handleOAuthLogin("discord")}
                                disabled={oauthLoading !== null}
                            >
                                <i className="fa-brands fa-discord"></i>
                                {oauthLoading === "discord" ? "連線中…" : "Discord"}
                            </button>
                            <button
                                className={styles.oAuthButtonGoogle}
                                onClick={() => handleOAuthLogin("google")}
                                disabled={oauthLoading !== null}
                            >
                                <i className="fa-brands fa-google"></i>
                                {oauthLoading === "google" ? "連線中…" : "Google"}
                            </button>
                        </div>
                        {oauthError && (
                            <p className={styles.oAuthError}>{oauthError}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
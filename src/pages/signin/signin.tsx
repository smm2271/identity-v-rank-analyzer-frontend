import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
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

    useEffect(() => {
        document.body.classList.add("theme-signin");
        document.body.classList.remove("theme-public");
        document.documentElement.classList.add("theme-signin");
        document.documentElement.classList.remove("theme-public");

        return () => {
            document.body.classList.remove("theme-signin");
            document.documentElement.classList.remove("theme-signin");
        };
    }, []);

    async function handleOAuthLogin(provider: string) {
        setOauthLoading(provider);
        setOauthError(null);

        try {
            const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
            const { authorization_url, state } = await getOAuthAuthorizeUrl(provider, redirectUri);

            // 驗證從後端取得的資料以符合資安規範 (SonarQube S8475)
            // 阻擋未依預期格式的污點資料 (Tainted Data) 直接寫入 Storage 以徹底清除 Taint 標記
            // 後端 state 格式為 nonce:timestamp:signature，需允許冒號字元
            if (typeof state !== "string" || !/^[a-zA-Z0-9\-_=.:]+$/.test(state)) {
                throw new Error("無效或不安全的 OAuth State 格式");
            }

            // 將 state、provider、redirect_uri 暫存到 sessionStorage（供 callback 頁面驗證用）
            sessionStorage.setItem("oauth_state", state);
            sessionStorage.setItem("oauth_provider", provider);
            sessionStorage.setItem("oauth_redirect_uri", redirectUri);

            // 驗證 authorization_url 的安全性 (防範 Open Redirect 弱點 S6105)
            // 由於連結來自後端因此不具直接信任度，需確保符合預期的協議與 OAuth 供應商網域
            const parsedAuthUrl = new URL(String(authorization_url));
            const validHosts = ["discord.com", "accounts.google.com"];

            if (parsedAuthUrl.protocol !== "https:" || !validHosts.includes(parsedAuthUrl.hostname)) {
                throw new Error("不信任的授權連結來源或安全協定");
            }

            // 導向 OAuth 供應商授權頁面
            window.location.href = parsedAuthUrl.href;
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
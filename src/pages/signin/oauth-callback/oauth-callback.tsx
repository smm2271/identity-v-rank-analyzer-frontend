import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { handleOAuthCallback } from "../../../service/auth.service";
import type { OAuthFlowErrorDetail } from "../../../service/auth.service";
import { useUserAuthStore } from "../../../service/user_auth.service";
import { ApiError } from "../../../service/api";
import styles from "./oauth-callback.module.css";

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const setAccessToken = useUserAuthStore((s) => s.setAccessToken);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");
        const stateFromUrl = searchParams.get("state");

        // 從 sessionStorage 取回先前存的 OAuth 資訊
        const savedState = sessionStorage.getItem("oauth_state");
        const savedProvider = sessionStorage.getItem("oauth_provider");
        const savedRedirectUri = sessionStorage.getItem("oauth_redirect_uri");

        // 清除 sessionStorage 中的 OAuth 暫存資料
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_provider");
        sessionStorage.removeItem("oauth_redirect_uri");

        // 基本驗證
        if (!code || !stateFromUrl) {
            setError("缺少必要的授權參數 (code / state)");
            return;
        }
        if (!savedProvider || !savedState || !savedRedirectUri) {
            setError("找不到先前的授權資訊，請重新登入");
            return;
        }
        if (stateFromUrl !== savedState) {
            setError("授權狀態驗證失敗 (CSRF 檢查不通過)，請重新登入");
            return;
        }

        // 向後端交換 tokens
        handleOAuthCallback(savedProvider, code, stateFromUrl, savedRedirectUri)
            .then((tokens) => {
                setAccessToken(tokens.access_token, tokens.user.username);
                navigate("/app/dashboard", { replace: true });
            })
            .catch((err) => {
                if (err instanceof ApiError) {
                    const detail = err.payload as OAuthFlowErrorDetail | null;
                    if (err.status === 403 && detail?.code === "REGISTRATION_REQUIRED" && detail.registration_token) {
                        sessionStorage.setItem("oauth_registration_token", detail.registration_token);
                        sessionStorage.setItem("oauth_registration_email", detail.email ?? "");
                        sessionStorage.setItem("oauth_registration_provider", detail.provider ?? savedProvider);
                        navigate("/signin/complete-profile", { replace: true });
                        return;
                    }

                    if (err.status === 403 && detail?.code === "LINK_REQUIRED" && detail.link_token) {
                        sessionStorage.setItem("oauth_link_token", detail.link_token);
                        sessionStorage.setItem("oauth_link_email", detail.email ?? "");
                        sessionStorage.setItem("oauth_link_provider", detail.provider ?? savedProvider);
                        navigate("/signin/link-identity", { replace: true });
                        return;
                    }

                    setError(err.detail);
                } else {
                    setError("登入過程中發生未知錯誤，請稍後再試");
                }
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) {
        return (
            <div className={styles.callbackContainer}>
                <div className={styles.errorContainer}>
                    <i className={`fa-solid fa-circle-exclamation ${styles.errorIcon}`}></i>
                    <p className={styles.errorMessage}>{error}</p>
                    <Link to="/signin?type=login" className={styles.retryButton}>
                        返回登入頁面
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.callbackContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.message}>正在處理登入，請稍候…</p>
        </div>
    );
}

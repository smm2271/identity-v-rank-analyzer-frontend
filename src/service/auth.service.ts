import { get, post } from "./api";

// ─── Types ───────────────────────────────────────────────────────

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface OAuthAuthorizeResponse {
    authorization_url: string;
    state: string;
}

// ─── Auth API ────────────────────────────────────────────────────

/** 以 Email + 密碼登入 */
export function login(email: string, password: string): Promise<TokenResponse> {
    return post<TokenResponse>("/auth/login", { email, password });
}

/** 以 Email + 密碼註冊 */
export function register(
    email: string,
    password: string,
    username?: string,
): Promise<TokenResponse> {
    return post<TokenResponse>("/auth/register", { email, password, username });
}

/** 取得 OAuth 授權 URL */
export function getOAuthAuthorizeUrl(
    provider: string,
    redirectUri: string,
): Promise<OAuthAuthorizeResponse> {
    return get<OAuthAuthorizeResponse>(`/auth/${provider}/authorize`, {
        redirect_uri: redirectUri,
    });
}

/** 處理 OAuth 回呼，交換 code 取得 tokens */
export function handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
    redirectUri: string,
): Promise<TokenResponse> {
    return get<TokenResponse>(`/auth/${provider}/callback`, {
        code,
        state,
        redirect_uri: redirectUri,
    });
}

/** 以 Refresh Token 換發新 tokens */
export function refreshToken(
    refresh_token: string,
): Promise<TokenResponse> {
    return post<TokenResponse>("/auth/refresh", { refresh_token });
}

/** 登出（撤銷所有 tokens） */
export function logout(accessToken: string): Promise<{ message: string }> {
    return post<{ message: string }>("/auth/logout", undefined, {
        Authorization: `Bearer ${accessToken}`,
    });
}

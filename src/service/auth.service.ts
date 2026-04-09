import { get, post } from "./api";

// ─── Types ───────────────────────────────────────────────────────

export interface TokenResponse {
    access_token: string;
    token_type: string;
    user: {
        id: string;
        username: string | null;
        email: string | null;
    };
}

export interface OAuthAuthorizeResponse {
    authorization_url: string;
    state: string;
}

export interface OAuthFlowErrorDetail {
    code?: string;
    message?: string;
    registration_token?: string;
    link_token?: string;
    provider?: string;
    email?: string;
    verification_oauth_providers?: string[];
}

// ─── Auth API ────────────────────────────────────────────────────

/** 以 Email + 密碼登入 */
export function login(identifier: string, password: string): Promise<TokenResponse> {
    return post<TokenResponse>("/auth/login", { identifier, password });
}

/** 以 Email + 密碼註冊 */
export function register(
    email: string,
    password: string,
    username?: string,
    termsAccepted: boolean = false,
): Promise<TokenResponse> {
    return post<TokenResponse>("/auth/register", { email, password, username, terms_accepted: termsAccepted });
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
    linkToken?: string,
): Promise<TokenResponse> {
    const query: Record<string, string> = {
        code,
        state,
        redirect_uri: redirectUri,
    };

    if (linkToken) {
        query.link_token = linkToken;
    }

    return get<TokenResponse>(`/auth/${provider}/callback`, query);
}

export function oauthFinalize(
    registrationToken: string,
    username: string,
    termsAccepted: boolean,
): Promise<TokenResponse> {
    return post<TokenResponse>("/auth/oauth-finalize", {
        registration_token: registrationToken,
        username,
        terms_accepted: termsAccepted,
    });
}

export function linkIdentity(
    linkToken: string,
    identifier: string,
    password: string,
): Promise<TokenResponse> {
    return post<TokenResponse>("/auth/link-identity", {
        link_token: linkToken,
        identifier,
        password,
    });
}

/** 以 Refresh Token 換發新 tokens */
export function refreshToken(): Promise<TokenResponse> {
    return post<TokenResponse>("/auth/refresh");
}

/** 登出（撤銷當前 session） */
export function logout(accessToken: string): Promise<void> {
    return post<void>("/auth/logout", undefined, {
        Authorization: `Bearer ${accessToken}`,
    });
}

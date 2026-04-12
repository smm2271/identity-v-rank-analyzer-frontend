import { useUserAuthStore } from "./user_auth.service";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
    status: number;
    detail: string;
    payload: unknown;

    constructor(status: number, detail: string, payload: unknown = null) {
        super(detail);
        this.name = "ApiError";
        this.status = status;
        this.detail = detail;
        this.payload = payload;
    }
}

// ─── Token Refresh 機制 ──────────────────────────────────────────

/** 防止多個 401 同時觸發重複 refresh */
let refreshPromise: Promise<boolean> | null = null;

/**
 * 嘗試用 Refresh Token 換發新的 Token Pair。
 * 回傳 true 表示刷新成功，false 表示失敗（需登出）。
 */
async function tryRefreshToken(): Promise<boolean> {
    const { setAccessToken, clearAuth } = useUserAuthStore.getState();

    try {
        const url = buildUrl("/auth/refresh");
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!response.ok) {
            clearAuth();
            return false;
        }

        const data = await response.json();
        setAccessToken(data.access_token, data.user?.username ?? null);
        return true;
    } catch {
        clearAuth();
        return false;
    }
}

// ─── 核心請求處理 ────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        const detail = body.detail;

        if (typeof detail === "string") {
            throw new ApiError(response.status, detail, detail);
        }

        if (detail && typeof detail === "object") {
            const detailObject = detail as Record<string, unknown>;
            const message =
                typeof detailObject.message === "string"
                    ? detailObject.message
                    : typeof detailObject.detail === "string"
                        ? detailObject.detail
                        : "未知錯誤";
            throw new ApiError(response.status, message, detailObject);
        }

        throw new ApiError(response.status, "未知錯誤", body);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

function buildUrl(path: string): URL {
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const pathUrl = path.startsWith('/') ? path : `/${path}`;
    const fullPath = `${baseUrl}${pathUrl}`;
    
    // 如果是完整的 URL (http開頭) 則直接轉解析；若是相對路徑 (/api) 則補上 origin
    if (fullPath.startsWith('http')) {
        return new URL(fullPath);
    }
    return new URL(fullPath, window.location.origin);
}

/**
 * 帶有 401 自動刷新能力的 fetch 封裝。
 * 當收到 401 時自動嘗試 refresh token，成功後以新 token 重試原請求。
 */
async function authFetch(url: string, options: RequestInit): Promise<Response> {
    let response = await fetch(url, { ...options, credentials: "include" });

    if (response.status === 401) {
        // 避免多個並行請求同時觸發 refresh
        if (!refreshPromise) {
            refreshPromise = tryRefreshToken().finally(() => {
                refreshPromise = null;
            });
        }

        const refreshed = await refreshPromise;

        if (refreshed) {
            // 刷新成功：用新的 access token 重試原始請求
            const newAccessToken = useUserAuthStore.getState().accessToken;
            const newHeaders = new Headers(options.headers);
            if (newAccessToken) {
                newHeaders.set("Authorization", `Bearer ${newAccessToken}`);
            }
            response = await fetch(url, {
                ...options,
                headers: newHeaders,
                credentials: "include",
            });
        }
    }

    return response;
}

// ─── 公開 API ────────────────────────────────────────────────────

export async function get<T>(
    path: string,
    params?: Record<string, string>,
    headers?: Record<string, string>,
): Promise<T> {
    const url = buildUrl(path);
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const response = await authFetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json", ...headers },
    });
    return handleResponse<T>(response);
}

export async function post<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
): Promise<T> {
    const url = buildUrl(path);
    const response = await authFetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
}

export async function del<T>(
    path: string,
    headers?: Record<string, string>,
): Promise<T> {
    const url = buildUrl(path);
    const response = await authFetch(url.toString(), {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...headers },
    });
    return handleResponse<T>(response);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
    status: number;
    detail: string;

    constructor(status: number, detail: string) {
        super(detail);
        this.name = "ApiError";
        this.status = status;
        this.detail = detail;
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: "未知錯誤" }));
        throw new ApiError(response.status, body.detail ?? "未知錯誤");
    }
    return response.json() as Promise<T>;
}

export async function get<T>(
    path: string,
    params?: Record<string, string>,
    headers?: Record<string, string>,
): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const response = await fetch(url.toString(), {
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
    const url = new URL(path, API_BASE_URL);
    const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
}

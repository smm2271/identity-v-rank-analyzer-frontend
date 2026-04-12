import { del, get, post } from "./api";
import { useUserAuthStore } from "./user_auth.service";

export interface ApiKeyCreatePayload {
    name?: string;
}

export interface ApiKeyCreateResponse {
    id: string;
    name: string | null;
    api_key: string;
    is_active: boolean;
    created_at: string;
}

export interface ApiKeyListItem {
    id: string;
    name: string | null;
    is_active: boolean;
    last_used_at: string | null;
    created_at: string;
}

export interface MessageResponse {
    message: string;
}

function getAuthHeaders(): Record<string, string> | undefined {
    const accessToken = useUserAuthStore.getState().accessToken;
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function createMyApiKey(payload: ApiKeyCreatePayload): Promise<ApiKeyCreateResponse> {
    return post<ApiKeyCreateResponse>("/users/me/api-keys", payload, getAuthHeaders());
}

export async function getMyApiKeys(): Promise<ApiKeyListItem[]> {
    return get<ApiKeyListItem[]>("/users/me/api-keys", undefined, getAuthHeaders());
}

export async function deactivateMyApiKey(keyId: string): Promise<MessageResponse> {
    return del<MessageResponse>(`/users/me/api-keys/${keyId}`, getAuthHeaders());
}

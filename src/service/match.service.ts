import { get } from "./api";
import { useUserAuthStore } from "./user_auth.service";

export interface MatchItem {
    id: string;
    room_guuid: string;
    uploader_id: string;
    scene_id: number | null;
    match_type: number | null;
    rank_level: number | null;
    kill_num: number | null;
    utype: number | null;
    pid: number | null;
    game_save_time: string | null;
    cipher_progress: Record<string, unknown> | null;
    created_at: string;
}

export interface MatchListResponse {
    total: number;
    offset: number;
    limit: number;
    items: MatchItem[];
}

export async function getMyMatches(offset: number, limit: number): Promise<MatchListResponse> {
    const accessToken = useUserAuthStore.getState().accessToken;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

    return get<MatchListResponse>(
        "/v1/matches",
        {
            offset: String(offset),
            limit: String(limit),
        },
        headers,
    );
}

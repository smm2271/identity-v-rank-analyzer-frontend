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

export interface PlayerInfoItem {
    id: string;
    player_id: number;
    player_name: string | null;
    character_id: number;
    res_type: number | null;
    created_at: string;
}

export interface MatchDetailResponse extends MatchItem {
    players: PlayerInfoItem[];
}

export interface LadderScoreItem {
    id: string;
    user_id: string;
    pid: number;
    score: number;
    recorded_at: string;
}

export interface MatchListResponse {
    total: number;
    offset: number;
    limit: number;
    items: MatchItem[];
}

export interface LatestLadderScoresResponse {
    latest_scores: Record<string, LadderScoreItem>;
}

export interface LadderScoresListResponse {
    pid: number;
    scores: LadderScoreItem[];
}

function getAuthHeaders(): Record<string, string> | undefined {
    const accessToken = useUserAuthStore.getState().accessToken;
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function getMyMatches(offset: number, limit: number): Promise<MatchListResponse> {
    return get<MatchListResponse>(
        "/api/v1/matches",
        {
            offset: String(offset),
            limit: String(limit),
        },
        getAuthHeaders(),
    );
}

export async function getLatestLadderScores(): Promise<LatestLadderScoresResponse> {
    return get<LatestLadderScoresResponse>("/api/v1/matches/ladder-scores/latest", undefined, getAuthHeaders());
}

export async function getLadderScoreHistory(pid: number, limit = 60): Promise<LadderScoresListResponse> {
    return get<LadderScoresListResponse>(
        `/api/v1/matches/ladder-scores/${pid}`,
        {
            limit: String(limit),
        },
        getAuthHeaders(),
    );
}

export async function getMatchDetail(matchId: string): Promise<MatchDetailResponse> {
    return get<MatchDetailResponse>(`/api/v1/matches/${matchId}`, undefined, getAuthHeaders());
}

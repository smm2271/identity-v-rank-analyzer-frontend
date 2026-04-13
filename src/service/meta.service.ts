import localMeta from "../../data.json";

export type RoleType = "hunter" | "survivor";

export interface CharacterGroups {
    hunter: Record<string, string>;
    survivor: Record<string, string>;
}

export interface GameMeta {
    character: CharacterGroups;
    mode: Record<string, string>;
    map: Record<string, string>;
    res_type?: Record<string, number[]>;
}

let cachedMeta: GameMeta | null = null;

const META_ENDPOINT = "/game-meta.json";

function normalizeMeta(raw: unknown): GameMeta {
    const fallback = localMeta as GameMeta;
    if (!raw || typeof raw !== "object") {
        return fallback;
    }

    const data = raw as Partial<GameMeta>;
    const rawCharacter = data.character as Partial<CharacterGroups> | undefined;
    const normalizedCharacter: CharacterGroups = {
        hunter: rawCharacter?.hunter ?? fallback.character.hunter,
        survivor: rawCharacter?.survivor ?? fallback.character.survivor,
    };

    const normalized: GameMeta = {
        character: normalizedCharacter,
        mode: data.mode ?? fallback.mode,
        map: data.map ?? fallback.map,
        res_type: data.res_type ?? fallback.res_type,
    };

    return normalized;
}

export async function getGameMeta(forceRefresh = false): Promise<GameMeta> {
    if (cachedMeta && !forceRefresh) {
        return cachedMeta;
    }

    try {
        const response = await fetch(META_ENDPOINT, { method: "GET" });
        if (!response.ok) {
            throw new Error("Meta endpoint unavailable");
        }
        const payload = (await response.json()) as unknown;
        cachedMeta = normalizeMeta(payload);
        return cachedMeta;
    } catch {
        cachedMeta = normalizeMeta(localMeta);
        return cachedMeta;
    }
}

export function getCharacterName(meta: GameMeta, pid: number | null): string {
    if (pid === null) return "-";
    const key = String(pid);
    return meta.character.hunter[key] ?? meta.character.survivor[key] ?? `角色 ${pid}`;
}

export function getModeName(meta: GameMeta, matchType: number | null): string {
    if (matchType === null) return "未知";
    return meta.mode[String(matchType)] ?? `類型 ${matchType}`;
}

export function getMapName(meta: GameMeta, sceneId: number | null): string {
    if (sceneId === null) return "未知";
    return meta.map[String(sceneId)] ?? `地圖 ${sceneId}`;
}

export function getRoleTypeByPid(meta: GameMeta, pid: number): RoleType {
    if (meta.character.hunter[String(pid)] !== undefined) {
        return "hunter";
    }
    return "survivor";
}

export function getCharacterLookup(meta: GameMeta): Record<string, string> {
    return {
        ...meta.character.hunter,
        ...meta.character.survivor,
    };
}

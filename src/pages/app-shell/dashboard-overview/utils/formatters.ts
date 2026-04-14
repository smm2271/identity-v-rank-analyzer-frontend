import dataDict from "../../../../../data.json";

const characterLookup = {
    ...((dataDict as any).character?.hunter ?? {}),
    ...((dataDict as any).character?.survivor ?? {}),
} as Record<string, string>;

export function formatMatchType(matchType: number | null): string {
    if (matchType === null) return "未知";
    return (dataDict.mode as any)[String(matchType)] ?? `類型 ${matchType}`;
}

export function formatCharacter(pid: number | null): string {
    if (pid === null) return "-";
    return characterLookup[String(pid)] ?? `角色 ${pid}`;
}

export function formatMap(scene_id: number | null): string {
    if (scene_id === null) return "未知";
    return (dataDict as Record<string, any>).map?.[String(scene_id)] ?? `地圖 ${scene_id}`;
}

import type { MatchItem } from "../../../../service/match.service";
import { formatMatchType } from "./formatters";

/** 取得常用角色排行榜 */
export function getTopUsed(items: MatchItem[], role: number, limit = 3) {
    const counts: Record<number, number> = {};
    for (const item of items) {
        if (item.utype === role && item.pid !== null) {
            counts[item.pid] = (counts[item.pid] ?? 0) + 1;
        }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, limit).map(([pidStr, count]) => ({
        pid: Number.parseInt(pidStr, 10),
        count
    }));
}

/** 計算勝/平/負分佈 */
export function calculateResults(items: MatchItem[], role: number) {
    let win = 0, tie = 0, loss = 0;
    for (const item of items) {
        if (item.utype !== role || item.match_type === 3 || item.match_type === 10) continue; 
        if (item.kill_num === null) continue;

        if (role === 1) { // Hunter
            if (item.kill_num >= 3) win++;
            else if (item.kill_num === 2) tie++;
            else loss++;
        } else if (role === 2) { // Survivor
            if (item.kill_num <= 1) win++;
            else if (item.kill_num === 2) tie++;
            else loss++;
        }
    }
    return { win, tie, loss, total: win + tie + loss };
}

/** 篩選出有用於計算勝率/平均數的對局 */
export function getRoleMatchesWithKillNum(items: MatchItem[], role: number): MatchItem[] {
    return items.filter((item) => {
        if (item.utype !== role) return false;
        if (item.match_type === 3 || item.match_type === 10) return false;
        return item.kill_num !== null;
    });
}

/** 統計模式分佈 */
export function aggregateCounts(items: MatchItem[]) {
    const counts: Record<string, number> = {};
    for (const item of items) {
        const key = formatMatchType(item.match_type);
        counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
}

/** 取得最高頻次的項目 */
export function pickTopEntry(entries: Record<string, number>): { label: string; value: number } | null {
    const sorted = Object.entries(entries).sort((left, right) => right[1] - left[1]);
    if (sorted.length === 0) return null;
    const [label, value] = sorted[0];
    return { label, value };
}

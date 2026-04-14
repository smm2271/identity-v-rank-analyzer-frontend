import { useState, useEffect, useMemo } from "react";
import { ApiError } from "../../../../service/api";
import { getMyMatches, type MatchListResponse } from "../../../../service/match.service";
import { useUserAuthStore } from "../../../../service/user_auth.service";
import { 
    aggregateCounts, 
    pickTopEntry, 
    getTopUsed, 
    calculateResults, 
    getRoleMatchesWithKillNum 
} from "../utils/analytics";
import { formatMap } from "../utils/formatters";
import type { DashboardStats, PieData } from "../types";

export function useDashboardData() {
    const accessToken = useUserAuthStore((state: any) => state.accessToken);
    const [matches, setMatches] = useState<MatchListResponse | null>(null);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setPageLoading(true);
        setMatchError(null);

        // 注意：目前僅抓取最近 100 場紀錄
        getMyMatches(0, 100)
            .then((response: MatchListResponse) => {
                if (!active) return;
                setMatches(response);
            })
            .catch((error: any) => {
                if (!active) return;
                const message = error instanceof ApiError ? error.detail : "讀取對戰資料失敗";
                setMatchError(message);
            })
            .finally(() => {
                if (active) {
                    setPageLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [accessToken]);

    const recentMatches = matches?.items ?? [];
    const totalMatches = matches?.total ?? 0;
    const loadedMatchCount = recentMatches.length;

    const stats: DashboardStats = useMemo(() => {
        const matchCounts = aggregateCounts(recentMatches);
        const topMatchType = pickTopEntry(matchCounts);

        const mapDist: Record<string, number> = {};
        for (const item of recentMatches) {
            if (item.scene_id !== null) {
                const key = formatMap(item.scene_id);
                mapDist[key] = (mapDist[key] ?? 0) + 1;
            }
        }
        const sortedMap = Object.entries(mapDist).sort((a, b) => b[1] - a[1]);
        const top5Map = sortedMap.slice(0, 5);
        const othersMap = sortedMap.slice(5).reduce((sum, item) => sum + item[1], 0);
        const mapColors = ["#4D9CFF", "#FF885E", "#FFCA4D", "#9B6BFF", "#4DD2FF", "#7C8CA0"];
        const mapCounts: PieData[] = top5Map.map(([label, value], i) => ({
            label, value, color: mapColors[i % mapColors.length]
        }));
        if (othersMap > 0) {
            mapCounts.push({ label: "其他地圖", value: othersMap, color: mapColors[5] });
        }

        const hunterAverageKills = (() => {
            const hMatches = getRoleMatchesWithKillNum(recentMatches, 1);
            if (hMatches.length === 0) return null;
            return hMatches.reduce((total, item) => total + (item.kill_num ?? 0), 0) / hMatches.length;
        })();

        const survivorEscapeRate = (() => {
            const sMatches = getRoleMatchesWithKillNum(recentMatches, 2);
            if (sMatches.length === 0) return null;
            const escapedCount = sMatches.reduce((total, item) => {
                const kills = item.kill_num ?? 0;
                return total + Math.max(0, Math.min(4, 4 - kills));
            }, 0);
            return (escapedCount / (sMatches.length * 4)) * 100;
        })();

        return {
            totalMatches,
            loadedMatchCount,
            matchCounts,
            topMatchType,
            mapCounts,
            topHunters: getTopUsed(recentMatches, 1),
            topSurvivors: getTopUsed(recentMatches, 2),
            hunterResults: calculateResults(recentMatches, 1),
            survivorResults: calculateResults(recentMatches, 2),
            hunterAverageKills,
            survivorEscapeRate,
        };
    }, [recentMatches, totalMatches]);

    return {
        stats,
        pageLoading,
        matchError,
        hasMatches: matches !== null
    };
}

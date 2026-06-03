import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError } from "../../../service/api";
import {
    getLadderScoreHistory,
    getLatestLadderScores,
    getMyMatches,
    getMatchDetail,
    type LadderScoreItem,
    type MatchItem,
    type MatchDetailResponse,
} from "../../../service/match.service";
import {
    getCharacterName,
    getGameMeta,
    getMapName,
    getRoleTypeByPid,
    type GameMeta,
} from "../../../service/meta.service";
import styles from "./analysis-center.module.css";

type AnalysisCard = {
    key: string;
    title: string;
    description: string;
    chartPlan: string;
    queryValue: string;
};

type ScoreRow = {
    pid: number;
    name: string;
    score: number;
    recordedAt: string;
    roleType: "hunter" | "survivor";
};

const CHART_WIDTH = 620;
const CHART_HEIGHT = 240;
const CHART_PADDING = 24;

type ChartPoint = {
    x: number;
    y: number;
    score: number;
    recordedAt: string;
};

type CombinedMapCharacter = {
    mapId: number | null;
    mapName: string;
    totalMatches: number;
    winCount: number;
    tieCount: number;
    lossCount: number;
    topCharacters: Array<{ pid: number; name: string; roleType: "hunter" | "survivor"; count: number }>;
};

type LineupCombo = {
    comboKey: string;
    members: string[];
    totalMatches: number;
    winCount: number;
    lossCount: number;
    winRate: number;
};

const ANALYSIS_CARDS: AnalysisCard[] = [
    {
        key: "role-scores",
        title: "所有角色認知分",
        description: "追蹤每個角色的目前認知分與近 30 場變化。",
        chartPlan: "折線圖 + 水平長條圖",
        queryValue: "role-scores",
    },
    {
        key: "lineup-analysis",
        title: "陣容相剋與搭配",
        description: "用近期對局資料分析常見角色搭配與整體勝率。",
        chartPlan: "組合排行 + 勝率表",
        queryValue: "lineup-analysis",
    },
    {
        key: "map-character",
        title: "地圖 x 角色交叉",
        description: "比較同角色在不同地圖上的出場熱度與勝率。",
        chartPlan: "地圖統計 + 熱門角色清單",
        queryValue: "map-character",
    },
];

function formatWinRate(value: number, total: number) {
    if (total === 0) return "—";
    return `${Math.round((value / total) * 100)}%`;
}

function getMatchResult(item: MatchItem): "win" | "tie" | "loss" | "unknown" {
    if (item.kill_num === null) {
        return "unknown";
    }

    if (item.utype === 1) {
        if (item.kill_num >= 3) return "win";
        if (item.kill_num === 2) return "tie";
        return "loss";
    }

    if (item.utype === 2) {
        if (item.kill_num <= 1) return "win";
        if (item.kill_num === 2) return "tie";
        return "loss";
    }

    return "unknown";
}

function getSurvivorResultByResType(meta: GameMeta, resType: number | null) {
    const escaped = meta.res_type?.["逃脫"] ?? [];
    const lost = meta.res_type?.["迷失"] ?? [];

    if (resType === null) return "unknown";
    if (escaped.includes(resType)) return "win";
    if (lost.includes(resType)) return "loss";
    return "unknown";
}

export default function AnalysisCenterPage() {
    const [searchParams] = useSearchParams();
    const highlighted = searchParams.get("view");
    const [scoresLoading, setScoresLoading] = useState(false);
    const [scoresError, setScoresError] = useState<string | null>(null);
    const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
    const [keyword, setKeyword] = useState("");
    const [selectedRow, setSelectedRow] = useState<ScoreRow | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyItems, setHistoryItems] = useState<LadderScoreItem[]>([]);
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(max-width: 900px)").matches;
    });
    const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
    const [meta, setMeta] = useState<GameMeta | null>(null);
    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError] = useState<string | null>(null);
    const [matchDetails, setMatchDetails] = useState<MatchDetailResponse[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (highlighted !== "role-scores") {
            return;
        }

        let active = true;
        setScoresLoading(true);
        setScoresError(null);

        Promise.all([getGameMeta(), getLatestLadderScores()])
            .then(([metaData, response]) => {
                if (!active) return;
                const rows = Object.values(response.latest_scores)
                    .map((item: LadderScoreItem) => {
                        const characterName = getCharacterName(metaData, item.pid);
                        const roleType = getRoleTypeByPid(metaData, item.pid);
                        return {
                            pid: item.pid,
                            name: characterName,
                            score: item.score,
                            recordedAt: item.recorded_at,
                            roleType,
                        };
                    })
                    .sort((left, right) => right.score - left.score);
                setScoreRows(rows);
            })
            .catch((error: unknown) => {
                if (!active) return;
                const message = error instanceof ApiError ? error.detail : "讀取角色認知分失敗";
                setScoresError(message);
            })
            .finally(() => {
                if (active) {
                    setScoresLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [highlighted]);

    useEffect(() => {
        if (!selectedRow) {
            return;
        }

        let active = true;
        setHistoryLoading(true);
        setHistoryError(null);

        getLadderScoreHistory(selectedRow.pid, 30)
            .then((response) => {
                if (!active) return;
                const sorted = [...response.scores].sort(
                    (left, right) => new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime(),
                );
                setHistoryItems(sorted);
            })
            .catch((error: unknown) => {
                if (!active) return;
                const message = error instanceof ApiError ? error.detail : "讀取角色歷史分數失敗";
                setHistoryError(message);
            })
            .finally(() => {
                if (active) {
                    setHistoryLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [selectedRow]);

    useEffect(() => {
        let active = true;
        setMatchesLoading(true);
        setMatchesError(null);

        Promise.all([getGameMeta(), getMyMatches(0, 100)])
            .then(([metaData, response]) => {
                if (!active) return;
                setMeta(metaData);
                setMatches(response.items);
            })
            .catch((error: unknown) => {
                if (!active) return;
                const message = error instanceof ApiError ? error.detail : "讀取對戰資料失敗";
                setMatchesError(message);
            })
            .finally(() => {
                if (active) {
                    setMatchesLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (highlighted !== "lineup-analysis" && highlighted !== "map-character") {
            return;
        }
        if (matches.length === 0) {
            return;
        }

        let active = true;
        setDetailsLoading(true);
        setDetailsError(null);

        const ids = matches.slice(0, 50).map((item) => item.id);
        Promise.allSettled(ids.map((id) => getMatchDetail(id))).then((results) => {
            if (!active) return;
            const loaded = results
                .filter((result): result is PromiseFulfilledResult<MatchDetailResponse> => result.status === "fulfilled")
                .map((result) => result.value);
            setMatchDetails(loaded);
            if (loaded.length === 0) {
                setDetailsError("無法載入足夠的對局明細以分析陣容與地圖。請稍後再試。");
            }
        }).catch(() => {
            if (!active) return;
            setDetailsError("讀取對局明細失敗，請稍後再試。");
        }).finally(() => {
            if (active) {
                setDetailsLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, [highlighted, matches]);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setSelectedRow(null);
            }
        }

        if (selectedRow) {
            window.addEventListener("keydown", onKeyDown);
        }

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [selectedRow]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const media = window.matchMedia("(max-width: 900px)");
        const onChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
            setHoveredPointIndex(null);
        };

        setIsMobile(media.matches);
        media.addEventListener("change", onChange);

        return () => {
            media.removeEventListener("change", onChange);
        };
    }, []);

    const filteredRows = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        const base = normalizedKeyword
            ? scoreRows.filter((row) => row.name.toLowerCase().includes(normalizedKeyword))
            : scoreRows;

        return [...base].sort((left, right) => right.score - left.score);
    }, [keyword, scoreRows]);

    const hunterRows = useMemo(() => {
        return filteredRows.filter((row) => row.roleType === "hunter");
    }, [filteredRows]);

    const survivorRows = useMemo(() => {
        return filteredRows.filter((row) => row.roleType === "survivor");
    }, [filteredRows]);

    const topScore = scoreRows.length > 0 ? scoreRows[0] : null;

    const chartPoints = useMemo(() => {
        if (historyItems.length === 0) {
            return { points: [] as ChartPoint[], minScore: 0, maxScore: 0 };
        }

        const scores = historyItems.map((item) => item.score);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const scoreRange = Math.max(1, maxScore - minScore);
        const step = historyItems.length > 1 ? (CHART_WIDTH - CHART_PADDING * 2) / (historyItems.length - 1) : 0;

        const points = historyItems.map((item, index) => {
            const x = CHART_PADDING + step * index;
            const normalized = (item.score - minScore) / scoreRange;
            const y = CHART_HEIGHT - CHART_PADDING - normalized * (CHART_HEIGHT - CHART_PADDING * 2);
            return { x, y, score: item.score, recordedAt: item.recorded_at };
        });

        return { points, minScore, maxScore };
    }, [historyItems]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || chartPoints.points.length === 0) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

        context.strokeStyle = "rgba(161, 178, 210, 0.38)";
        context.lineWidth = 1;

        context.beginPath();
        context.moveTo(CHART_PADDING, CHART_PADDING);
        context.lineTo(CHART_PADDING, CHART_HEIGHT - CHART_PADDING);
        context.lineTo(CHART_WIDTH - CHART_PADDING, CHART_HEIGHT - CHART_PADDING);
        context.stroke();

        context.beginPath();
        context.strokeStyle = "#55d7bc";
        context.lineWidth = 3;
        chartPoints.points.forEach((point, index) => {
            if (index === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        });
        context.stroke();

        chartPoints.points.forEach((point, index) => {
            const isHovered = hoveredPointIndex === index;
            context.beginPath();
            context.fillStyle = isHovered ? "#ffe082" : "#7ce0cd";
            context.arc(point.x, point.y, isHovered ? 5 : 3, 0, Math.PI * 2);
            context.fill();
        });
    }, [chartPoints.points, hoveredPointIndex]);

    const hoveredPoint = hoveredPointIndex === null ? null : chartPoints.points[hoveredPointIndex] ?? null;

    const characterStats = useMemo(() => {
        const stats: Record<number, {
            pid: number;
            name: string;
            roleType: "hunter" | "survivor";
            count: number;
            winCount: number;
            tieCount: number;
            lossCount: number;
            totalKills: number;
        }> = {};

        for (const item of matches) {
            if (item.pid === null) continue;
            const pid = item.pid;
            const name = meta ? getCharacterName(meta, pid) : String(pid);
            const roleType = meta ? getRoleTypeByPid(meta, pid) : "survivor";
            const result = getMatchResult(item);

            if (!stats[pid]) {
                stats[pid] = {
                    pid,
                    name,
                    roleType,
                    count: 0,
                    winCount: 0,
                    tieCount: 0,
                    lossCount: 0,
                    totalKills: 0,
                };
            }

            stats[pid].count += 1;
            stats[pid].totalKills += item.kill_num ?? 0;
            if (result === "win") stats[pid].winCount += 1;
            if (result === "tie") stats[pid].tieCount += 1;
            if (result === "loss") stats[pid].lossCount += 1;
        }

        return Object.values(stats).sort((left, right) => right.count - left.count);
    }, [matches, meta]);

    const mapCharacterStats = useMemo(() => {
        const mapGroups = new Map<string, CombinedMapCharacter>();

        for (const item of matches) {
            const mapId = item.scene_id;
            const mapName = meta ? getMapName(meta, mapId) : "未知地圖";
            const bucketKey = `${mapId ?? "unknown"}__${mapName}`;
            const result = getMatchResult(item);

            if (!mapGroups.has(bucketKey)) {
                mapGroups.set(bucketKey, {
                    mapId,
                    mapName,
                    totalMatches: 0,
                    winCount: 0,
                    tieCount: 0,
                    lossCount: 0,
                    topCharacters: [],
                });
            }

            const summary = mapGroups.get(bucketKey)!;
            summary.totalMatches += 1;
            if (result === "win") summary.winCount += 1;
            if (result === "tie") summary.tieCount += 1;
            if (result === "loss") summary.lossCount += 1;

            if (item.pid !== null) {
                const existing = summary.topCharacters.find((entry) => entry.pid === item.pid);
                if (existing) {
                    existing.count += 1;
                } else {
                    summary.topCharacters.push({
                        pid: item.pid,
                        name: meta ? getCharacterName(meta, item.pid) : String(item.pid),
                        roleType: meta ? getRoleTypeByPid(meta, item.pid) : "survivor",
                        count: 1,
                    });
                }
            }
        }

        const results: CombinedMapCharacter[] = Array.from(mapGroups.values()).map((summary) => ({
            ...summary,
            topCharacters: summary.topCharacters.sort((left, right) => right.count - left.count).slice(0, 3),
        }));

        return results.sort((left, right) => right.totalMatches - left.totalMatches);
    }, [matches, meta]);

    const lineupCombos = useMemo(() => {
        if (!meta || matchDetails.length === 0) return [] as LineupCombo[];

        const combos: Record<string, { members: string[]; totalMatches: number; winCount: number; lossCount: number }> = {};

        for (const detail of matchDetails) {
            const survivors = detail.players
                .filter((player) => getRoleTypeByPid(meta, player.character_id) === "survivor")
                .map((player) => getCharacterName(meta, player.character_id))
                .sort();

            if (survivors.length === 0) continue;

            const comboKey = survivors.join(" / ");
            const win = survivors.some((playerName) => {
                const player = detail.players.find(
                    (p) => getCharacterName(meta, p.character_id) === playerName && getRoleTypeByPid(meta, p.character_id) === "survivor",
                );
                return player ? getSurvivorResultByResType(meta, player.res_type) === "win" : false;
            });
            const loss = survivors.every((playerName) => {
                const player = detail.players.find(
                    (p) => getCharacterName(meta, p.character_id) === playerName && getRoleTypeByPid(meta, p.character_id) === "survivor",
                );
                return player ? getSurvivorResultByResType(meta, player.res_type) === "loss" : false;
            });

            if (!combos[comboKey]) {
                combos[comboKey] = {
                    members: survivors,
                    totalMatches: 0,
                    winCount: 0,
                    lossCount: 0,
                };
            }

            combos[comboKey].totalMatches += 1;
            if (win) combos[comboKey].winCount += 1;
            if (!win && loss) combos[comboKey].lossCount += 1;
        }

        return Object.entries(combos)
            .map(([comboKey, entry]) => ({
                comboKey,
                members: entry.members,
                totalMatches: entry.totalMatches,
                winCount: entry.winCount,
                lossCount: entry.lossCount,
                winRate: entry.totalMatches === 0 ? 0 : entry.winCount / entry.totalMatches,
            }))
            .sort((left, right) => right.totalMatches - left.totalMatches)
            .slice(0, 8);
    }, [meta, matchDetails]);

    const popularCharacters = useMemo(() => {
        const pivot = characterStats.sort((left, right) => right.count - left.count).slice(0, 6);
        return pivot;
    }, [characterStats]);

    useEffect(() => {
        if (!selectedRow) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedRow(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedRow]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const media = window.matchMedia("(max-width: 900px)");
        const onChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
            setHoveredPointIndex(null);
        };

        setIsMobile(media.matches);
        media.addEventListener("change", onChange);

        return () => media.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || chartPoints.points.length === 0) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);
        context.strokeStyle = "rgba(161, 178, 210, 0.38)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(CHART_PADDING, CHART_PADDING);
        context.lineTo(CHART_PADDING, CHART_HEIGHT - CHART_PADDING);
        context.lineTo(CHART_WIDTH - CHART_PADDING, CHART_HEIGHT - CHART_PADDING);
        context.stroke();

        context.beginPath();
        context.strokeStyle = "#55d7bc";
        context.lineWidth = 3;
        chartPoints.points.forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        });
        context.stroke();

        chartPoints.points.forEach((point, index) => {
            const isHovered = hoveredPointIndex === index;
            context.beginPath();
            context.fillStyle = isHovered ? "#ffe082" : "#7ce0cd";
            context.arc(point.x, point.y, isHovered ? 5 : 3, 0, Math.PI * 2);
            context.fill();
        });
    }, [chartPoints.points, hoveredPointIndex]);

    function handleCanvasMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
        if (isMobile || chartPoints.points.length === 0) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const scaleX = CHART_WIDTH / rect.width;
        const scaleY = CHART_HEIGHT / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        chartPoints.points.forEach((point, index) => {
            const dx = point.x - x;
            const dy = point.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        setHoveredPointIndex(nearestDistance < 24 ? nearestIndex : null);
    }

    if (highlighted === "role-scores") {
        return (
            <div className={styles.page}>
                <header className={styles.hero}>
                    <p className={styles.badge}>Analysis Hub</p>
                    <h2>所有角色認知分</h2>
                    <p>查看你目前每個角色的最新認知分，支援搜尋與排序，先快速找到主力與弱項角色。</p>
                </header>

                <section className={styles.scoreToolbar}>
                    <label className={styles.controlItem}>
                        角色搜尋
                        <input
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            placeholder="輸入角色名稱"
                        />
                    </label>
                </section>

                {topScore && (
                    <section className={styles.summaryCard}>
                        <p>目前最高認知分</p>
                        <strong>{topScore.name}</strong>
                        <span>{topScore.score.toLocaleString()} 分</span>
                    </section>
                )}

                {scoresLoading && <div className={styles.stateBox}>認知分資料載入中...</div>}
                {scoresError && <div className={`${styles.stateBox} ${styles.stateError}`}>{scoresError}</div>}

                {!scoresLoading && !scoresError && (
                    <>
                        {filteredRows.length === 0 && <div className={styles.stateBox}>沒有符合條件的角色資料</div>}

                        {hunterRows.length > 0 && (
                            <section className={styles.roleSection}>
                                <div className={styles.roleSectionHeader}>
                                    <h3>監管者</h3>
                                    <span>{hunterRows.length} 位角色</span>
                                </div>
                                <div className={styles.scoreGrid}>
                                    {hunterRows.map((row) => (
                                        <button
                                            key={row.pid}
                                            type="button"
                                            className={styles.roleCard}
                                            onClick={() => setSelectedRow(row)}
                                        >
                                            <p className={styles.roleName}>{row.name}</p>
                                            <strong>{row.score.toLocaleString()}</strong>
                                            <small>更新：{new Date(row.recordedAt).toLocaleDateString("zh-TW")}</small>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {survivorRows.length > 0 && (
                            <section className={styles.roleSection}>
                                <div className={styles.roleSectionHeader}>
                                    <h3>求生者</h3>
                                    <span>{survivorRows.length} 位角色</span>
                                </div>
                                <div className={styles.scoreGrid}>
                                    {survivorRows.map((row) => (
                                        <button
                                            key={row.pid}
                                            type="button"
                                            className={styles.roleCard}
                                            onClick={() => setSelectedRow(row)}
                                        >
                                            <p className={styles.roleName}>{row.name}</p>
                                            <strong>{row.score.toLocaleString()}</strong>
                                            <small>更新：{new Date(row.recordedAt).toLocaleDateString("zh-TW")}</small>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {selectedRow && (
                    <div
                        className={styles.modalBackdrop}
                        onClick={() => setSelectedRow(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRow(null); }}
                        role="presentation"
                    >
                        <div
                            className={styles.modal}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            role="presentation"
                        >
                            <div className={styles.modalHeader}>
                                <div>
                                    <p className={styles.modalBadge}>{selectedRow.roleType === "hunter" ? "監管者" : "求生者"}</p>
                                    <h3>{selectedRow.name} 認知分趨勢</h3>
                                </div>
                                <button type="button" className={styles.modalClose} onClick={() => setSelectedRow(null)}>關閉</button>
                            </div>

                            {historyLoading && <div className={styles.stateBox}>載入近 30 筆趨勢資料中...</div>}
                            {historyError && <div className={`${styles.stateBox} ${styles.stateError}`}>{historyError}</div>}

                            {!historyLoading && !historyError && historyItems.length > 0 && (
                                <div className={styles.chartWrap}>
                                    <div className={styles.chartArea}>
                                        <canvas
                                            ref={canvasRef}
                                            width={CHART_WIDTH}
                                            height={CHART_HEIGHT}
                                            className={styles.lineCanvas}
                                            onMouseMove={handleCanvasMouseMove}
                                            onMouseLeave={() => setHoveredPointIndex(null)}
                                        />
                                        {hoveredPoint && (
                                            <div
                                                className={styles.hoverTooltip}
                                                style={{
                                                    left: `${(hoveredPoint.x / CHART_WIDTH) * 100}%`,
                                                    top: `${(hoveredPoint.y / CHART_HEIGHT) * 100}%`,
                                                }}
                                            >
                                                <strong>{hoveredPoint.score.toLocaleString()} 分</strong>
                                                <span>{new Date(hoveredPoint.recordedAt).toLocaleString("zh-TW")}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.chartMeta}>
                                        <span>最低：{chartPoints.minScore.toLocaleString()}</span>
                                        <span>最高：{chartPoints.maxScore.toLocaleString()}</span>
                                        <span>最新：{historyItems[historyItems.length - 1]?.score.toLocaleString() ?? "-"}</span>
                                    </div>
                                    {isMobile && (
                                        <div className={styles.mobileHistoryList}>
                                            {historyItems.map((item) => (
                                                <div key={item.id} className={styles.mobileHistoryItem}>
                                                    <span>{new Date(item.recorded_at).toLocaleDateString("zh-TW")}</span>
                                                    <strong>{item.score.toLocaleString()} 分</strong>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!historyLoading && !historyError && historyItems.length === 0 && (
                                <div className={styles.stateBox}>這個角色目前沒有足夠的歷史資料。</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (highlighted === "lineup-analysis") {
        return (
            <div className={styles.page}>
                <header className={styles.hero}>
                    <p className={styles.badge}>Analysis Hub</p>
                    <h2>陣容相剋與搭配</h2>
                    <p>從近期對局推斷常見存活者陣容與其整體勝率，協助你判斷哪些搭配最穩定。</p>
                </header>

                {matchesLoading && <div className={styles.stateBox}>讀取對戰資料中...</div>}
                {matchesError && <div className={`${styles.stateBox} ${styles.stateError}`}>{matchesError}</div>}

                {!matchesLoading && !matchesError && (
                    <>
                        <section className={styles.analysisSection}>
                            <div className={styles.sectionHeader}>
                                <h3>熱門陣容</h3>
                                <span>分析最近 {matchDetails.length || matches.length} 場對局</span>
                            </div>

                            {detailsLoading && <div className={styles.stateBox}>載入對局明細中...</div>}
                            {detailsError && <div className={`${styles.stateBox} ${styles.stateError}`}>{detailsError}</div>}

                            {!detailsLoading && !detailsError && lineupCombos.length === 0 && (
                                <div className={styles.stateBox}>目前還沒有足夠的詳細對局資料來產生陣容分析。</div>
                            )}

                            {!detailsLoading && !detailsError && lineupCombos.length > 0 && (
                                <div className={styles.tableWrap}>
                                    <table className={styles.dataTable}>
                                        <thead>
                                            <tr>
                                                <th>存活者陣容</th>
                                                <th>出場次數</th>
                                                <th>逃脫率</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lineupCombos.map((combo) => (
                                                <tr key={combo.comboKey}>
                                                    <td>{combo.members.join(" / ")}</td>
                                                    <td>{combo.totalMatches} 場</td>
                                                    <td>{formatWinRate(combo.winCount, combo.totalMatches)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <section className={styles.analysisSection}>
                            <div className={styles.sectionHeader}>
                                <h3>熱門角色勝率</h3>
                            </div>
                            <div className={styles.statGrid}>
                                {popularCharacters.map((character) => (
                                    <article key={character.pid} className={styles.statCard}>
                                        <h4>{character.name}</h4>
                                        <p>{character.roleType === "hunter" ? "監管者" : "求生者"}</p>
                                        <p>出場：{character.count} 場</p>
                                        <p>勝率：{formatWinRate(character.winCount, character.count)}</p>
                                        <p>平均淘汰/逃脫：{(character.totalKills / character.count).toFixed(1)}</p>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        );
    }

    if (highlighted === "map-character") {
        return (
            <div className={styles.page}>
                <header className={styles.hero}>
                    <p className={styles.badge}>Analysis Hub</p>
                    <h2>地圖熱門角色分析</h2>
                    <p>檢視各張地圖的對局熱度、勝率，以及你常用角色在不同地圖上的表現差異。</p>
                </header>

                {matchesLoading && <div className={styles.stateBox}>讀取對戰資料中...</div>}
                {matchesError && <div className={`${styles.stateBox} ${styles.stateError}`}>{matchesError}</div>}

                {!matchesLoading && !matchesError && (
                    <>
                        <section className={styles.analysisSection}>
                            <div className={styles.sectionHeader}>
                                <h3>地圖勝率分析</h3>
                            </div>
                            <div className={styles.statGrid}>
                                {mapCharacterStats.map((map) => (
                                    <article key={`${map.mapId}-${map.mapName}`} className={styles.statCard}>
                                        <h4>{map.mapName}</h4>
                                        <p>近 {map.totalMatches} 場</p>
                                        <p>勝率：{formatWinRate(map.winCount, map.totalMatches)}</p>
                                        <p>平手：{map.tieCount} 場</p>
                                        <p>敗率：{formatWinRate(map.lossCount, map.totalMatches)}</p>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className={styles.analysisSection}>
                            <div className={styles.sectionHeader}>
                                <h3>地圖熱門角色</h3>
                            </div>
                            <div className={styles.tableWrap}>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>地圖</th>
                                            <th>熱門角色</th>
                                            <th>出場次數</th>
                                            <th>勝率</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mapCharacterStats.map((map) => (
                                            <tr key={`${map.mapId}-row`}>
                                                <td>{map.mapName}</td>
                                                <td>
                                                    {map.topCharacters.map((character, index) => (
                                                        <span key={character.pid} className={styles.tag}>
                                                            {character.name} ({character.roleType === "hunter" ? "監" : "求"})
                                                            {index < map.topCharacters.length - 1 ? ", " : ""}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td>{map.topCharacters.map((character) => character.count).join(" / ")}</td>
                                                <td>{formatWinRate(map.winCount, map.totalMatches)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.hero}>
                <p className={styles.badge}>Analysis Hub</p>
                <h2>分析中心</h2>
                <p>
                    這裡會集中管理所有分析頁面。你可以先從任一分析卡片進入，之後再逐步補完整體內容。
                </p>
            </header>

            <section className={styles.grid}>
                {ANALYSIS_CARDS.map((card) => {
                    const isHighlighted = highlighted === card.queryValue;

                    return (
                        <article
                            key={card.key}
                            className={`${styles.card} ${isHighlighted ? styles.cardHighlighted : ""}`}
                        >
                            <h3>{card.title}</h3>
                            <p className={styles.description}>{card.description}</p>
                            <p className={styles.chartPlan}>圖表規劃：{card.chartPlan}</p>
                            <Link to={`/app/analysis?view=${card.queryValue}`} className={styles.enterButton}>
                                進入功能
                            </Link>
                        </article>
                    );
                })}
            </section>

            <section className={styles.quickLinks}>
                <h3>快速入口</h3>
                <div className={styles.quickLinkList}>
                    <Link to="/app/history" className={styles.quickLink}>
                        前往歷史戰績
                    </Link>
                    <Link to="/app/api-keys" className={styles.quickLink}>
                        前往 API Keys
                    </Link>
                </div>
            </section>
        </div>
    );
}

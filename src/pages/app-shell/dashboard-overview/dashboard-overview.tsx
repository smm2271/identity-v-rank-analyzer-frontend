import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../../service/api";
import {
    getLadderScoreHistory,
    getLatestLadderScores,
    getMyMatches,
    type LadderScoreItem,
    type MatchItem,
    type MatchListResponse,
} from "../../../service/match.service";
import { useUserAuthStore } from "../../../service/user_auth.service";
import styles from "./dashboard-overview.module.css";

const MATCH_TYPE_LABEL: Record<number, string> = {
    1: "排位",
    2: "匹配",
    3: "五人制",
};

function formatDateTime(value: string | null): string {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatMatchType(matchType: number | null): string {
    if (matchType === null) return "未知";
    return MATCH_TYPE_LABEL[matchType] ?? `類型 ${matchType}`;
}


function buildLineChartPath(points: Array<{ x: number; y: number }>): string {
    if (points.length === 0) return "";
    if (points.length === 1) {
        const point = points[0];
        return `M ${point.x} ${point.y}`;
    }

    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function aggregateCounts(items: MatchItem[]) {
    const counts: Record<string, number> = {};
    for (const item of items) {
        const key = formatMatchType(item.match_type);
        counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
}

function pickTopEntry(entries: Record<string, number>): { label: string; value: number } | null {
    const sorted = Object.entries(entries).sort((left, right) => right[1] - left[1]);
    if (sorted.length === 0) return null;
    const [label, value] = sorted[0];
    return { label, value };
}

export default function DashboardOverviewPage() {
    const accessToken = useUserAuthStore((state) => state.accessToken);
    const [matches, setMatches] = useState<MatchListResponse | null>(null);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [latestScores, setLatestScores] = useState<LadderScoreItem[]>([]);
    const [scoreError, setScoreError] = useState<string | null>(null);
    const [selectedPid, setSelectedPid] = useState<number | null>(null);
    const [history, setHistory] = useState<LadderScoreItem[]>([]);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        let active = true;

        setPageLoading(true);
        setMatchError(null);
        setScoreError(null);

        Promise.allSettled([getMyMatches(0, 100), getLatestLadderScores()]).then((results) => {
            if (!active) return;

            const [matchResult, scoreResult] = results;

            if (matchResult.status === "fulfilled") {
                setMatches(matchResult.value);
            } else {
                const error = matchResult.reason;
                setMatchError(error instanceof ApiError ? error.detail : "讀取對戰資料失敗");
            }

            if (scoreResult.status === "fulfilled") {
                const scoreList = Object.values(scoreResult.value.latest_scores).sort((left, right) => {
                    if (right.recorded_at === left.recorded_at) {
                        return right.pid - left.pid;
                    }
                    return right.recorded_at.localeCompare(left.recorded_at);
                });
                setLatestScores(scoreList);

                setSelectedPid((currentPid) => {
                    if (currentPid !== null && scoreList.some((item) => item.pid === currentPid)) {
                        return currentPid;
                    }

                    const pidFromScores = scoreList[0]?.pid;
                    if (pidFromScores !== undefined) return pidFromScores;

                    const pidFromMatches = matchResult.status === "fulfilled"
                        ? matchResult.value.items.find((item) => item.pid !== null)?.pid ?? null
                        : null;

                    return pidFromMatches;
                });
            } else {
                const error = scoreResult.reason;
                setScoreError(error instanceof ApiError ? error.detail : "讀取認知分資料失敗");
            }

            setPageLoading(false);
        });

        return () => {
            active = false;
        };
    }, [accessToken]);

    useEffect(() => {
        if (selectedPid === null) {
            setHistory([]);
            setHistoryError(null);
            setHistoryLoading(false);
            return;
        }

        let active = true;

        setHistoryLoading(true);
        setHistoryError(null);

        getLadderScoreHistory(selectedPid, 60)
            .then((response) => {
                if (!active) return;

                const sortedScores = [...response.scores].sort((left, right) =>
                    left.recorded_at.localeCompare(right.recorded_at),
                );
                setHistory(sortedScores);
            })
            .catch((error) => {
                if (!active) return;
                setHistory([]);
                setHistoryError(error instanceof ApiError ? error.detail : "讀取認知分歷史失敗");
            })
            .finally(() => {
                if (active) {
                    setHistoryLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [selectedPid]);

    const recentMatches = matches?.items ?? [];
    const totalMatches = matches?.total ?? 0;
    const matchCounts = useMemo(() => aggregateCounts(recentMatches), [recentMatches]);
    const topMatchType = useMemo(() => pickTopEntry(matchCounts), [matchCounts]);
    const loadedMatchCount = recentMatches.length;
    const averageKills = useMemo(() => {
        const killValues = recentMatches.flatMap((item) => (item.kill_num === null ? [] : [item.kill_num]));
        if (killValues.length === 0) return null;
        const sum = killValues.reduce((total, value) => total + value, 0);
        return sum / killValues.length;
    }, [recentMatches]);

    const latestScoresSorted = useMemo(
        () => [...latestScores].sort((left, right) => right.score - left.score || right.pid - left.pid),
        [latestScores],
    );

    const selectedHistory = useMemo(() => [...history], [history]);
    const scoreBounds = useMemo(() => {
        if (selectedHistory.length === 0) {
            return { min: 0, max: 0 };
        }

        const scores = selectedHistory.map((item) => item.score);
        return {
            min: Math.min(...scores),
            max: Math.max(...scores),
        };
    }, [selectedHistory]);

    const lineChartPoints = useMemo(() => {
        const width = 360;
        const height = 180;
        const paddingX = 18;
        const paddingY = 18;

        if (selectedHistory.length === 0) return [];

        const scoreRange = Math.max(scoreBounds.max - scoreBounds.min, 1);
        const step = selectedHistory.length === 1 ? 0 : (width - paddingX * 2) / (selectedHistory.length - 1);

        return selectedHistory.map((item, index) => {
            const normalized = (item.score - scoreBounds.min) / scoreRange;
            return {
                x: paddingX + step * index,
                y: height - paddingY - normalized * (height - paddingY * 2),
                score: item.score,
                recordedAt: item.recorded_at,
            };
        });
    }, [scoreBounds.max, scoreBounds.min, selectedHistory]);

    const lineChartPath = useMemo(
        () => buildLineChartPath(lineChartPoints.map(({ x, y }) => ({ x, y }))),
        [lineChartPoints],
    );

    const latestScoreMax = latestScoresSorted.length > 0 ? Math.max(...latestScoresSorted.map((item) => item.score)) : 0;
    const latestUpdatedAt = useMemo(() => {
        const allTimestamps = [...recentMatches.map((item) => item.created_at), ...latestScores.map((item) => item.recorded_at)]
            .filter((value): value is string => Boolean(value));

        if (allTimestamps.length === 0) return null;
        return allTimestamps.sort((left, right) => right.localeCompare(left))[0] ?? null;
    }, [latestScores, recentMatches]);

    const selectedScoreTrend = useMemo(() => {
        if (selectedHistory.length < 2) return null;

        const firstScore = selectedHistory[0].score;
        const lastScore = selectedHistory[selectedHistory.length - 1].score;
        return lastScore - firstScore;
    }, [selectedHistory]);

    const latestSummary = latestScoresSorted[0] ?? null;

    return (
        <div className={styles.page}>
            <section className={styles.heroCard}>
                <div className={styles.heroCopy}>
                    <p className={styles.kicker}>總儀表板</p>
                    <h2>一手掌握你的對局與認知分走勢</h2>
                    <p className={styles.heroDescription}>
                        資料直接來自後端 API，顯示最近 100 場對戰、最新認知分，以及選定角色的歷史曲線。
                    </p>
                </div>

                <div className={styles.heroStats}>
                    <div>
                        <span>資料來源</span>
                        <strong>Matches + Ladder Scores</strong>
                    </div>
                    <div>
                        <span>最近更新</span>
                        <strong>{formatDateTime(latestUpdatedAt)}</strong>
                    </div>
                </div>
            </section>

            {(matchError || scoreError || historyError) && (
                <section className={styles.noticeStack}>
                    {matchError && <div className={`${styles.stateBox} ${styles.stateError}`}>{matchError}</div>}
                    {scoreError && <div className={`${styles.stateBox} ${styles.stateError}`}>{scoreError}</div>}
                    {historyError && <div className={`${styles.stateBox} ${styles.stateError}`}>{historyError}</div>}
                </section>
            )}

            <section className={styles.metricGrid}>
                <article className={styles.metricCard}>
                    <p className={styles.label}>總場次</p>
                    <p className={styles.value}>{pageLoading && matches === null ? "載入中..." : totalMatches.toLocaleString("zh-TW")}</p>
                    <p className={styles.hint}>已向 /api/v1/matches 請求分頁資訊</p>
                </article>

                <article className={styles.metricCard}>
                    <p className={styles.label}>最近載入筆數</p>
                    <p className={styles.value}>{pageLoading && matches === null ? "--" : loadedMatchCount.toLocaleString("zh-TW")}</p>
                    <p className={styles.hint}>用於模式分布與平均擊殺分析</p>
                </article>

                <article className={styles.metricCard}>
                    <p className={styles.label}>平均擊殺</p>
                    <p className={styles.value}>{averageKills === null ? "--" : averageKills.toFixed(1)}</p>
                    <p className={styles.hint}>依最近 100 場有效擊殺資料計算</p>
                </article>

                <article className={styles.metricCard}>
                    <p className={styles.label}>最高最新認知分</p>
                    <p className={styles.value}>{latestScoreMax > 0 ? latestScoreMax.toLocaleString("zh-TW") : "--"}</p>
                    <p className={styles.hint}>
                        {latestSummary ? `角色 ID ${latestSummary.pid}，更新於 ${formatDateTime(latestSummary.recorded_at)}` : "尚未取得 ladder score 資料"}
                    </p>
                </article>
            </section>

            <section className={styles.chartGrid}>
                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>對戰概況</p>
                            <h3>對戰模式分布</h3>
                        </div>
                        <p className={styles.panelMeta}>最近 {loadedMatchCount} 場</p>
                    </div>

                    {recentMatches.length === 0 ? (
                        <div className={styles.stateBox}>目前沒有可視化資料，請先載入對戰紀錄。</div>
                    ) : (
                        <div className={styles.modeChart} aria-label="對戰模式分布圖表">
                            {Object.entries(matchCounts)
                                .sort((left, right) => right[1] - left[1])
                                .map(([label, count]) => {
                                    const ratio = loadedMatchCount === 0 ? 0 : count / loadedMatchCount;
                                    return (
                                        <div key={label} className={styles.modeBar}>
                                            <div className={styles.modeBarTop}>
                                                <span>{label}</span>
                                                <strong>{count}</strong>
                                            </div>
                                            <div className={styles.modeBarTrack}>
                                                <span className={styles.modeBarFill} style={{ width: `${Math.max(ratio * 100, 6)}%` }} />
                                            </div>
                                            <small>{Math.round(ratio * 100)}%</small>
                                        </div>
                                    );
                                })}

                            {topMatchType && (
                                <div className={styles.modeSummary}>
                                    <span>主力模式</span>
                                    <strong>
                                        {topMatchType.label} · {topMatchType.value} 場
                                    </strong>
                                </div>
                            )}
                        </div>
                    )}
                </article>

                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>認知分軌跡</p>
                            <h3>認知分趨勢</h3>
                        </div>
                        <div className={styles.pidChips}>
                            {latestScoresSorted.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`${styles.pidChip} ${selectedPid === item.pid ? styles.pidChipActive : ""}`}
                                    onClick={() => setSelectedPid(item.pid)}
                                >
                                    {item.pid}
                                </button>
                            ))}
                        </div>
                    </div>

                    {historyLoading ? (
                        <div className={styles.stateBox}>讀取認知分歷史中...</div>
                    ) : selectedPid === null ? (
                        <div className={styles.stateBox}>尚未取得可用的認知分資料。</div>
                    ) : selectedHistory.length === 0 ? (
                        <div className={styles.stateBox}>這個角色還沒有歷史資料。</div>
                    ) : (
                        <div className={styles.lineChartWrap}>
                            <div className={styles.lineChartMeta}>
                                <div>
                                    <span>角色 ID</span>
                                    <strong>{selectedPid}</strong>
                                </div>
                                <div>
                                    <span>最新分數</span>
                                    <strong>{selectedHistory[selectedHistory.length - 1]?.score ?? "-"}</strong>
                                </div>
                                <div>
                                    <span>區間變化</span>
                                    <strong>{selectedScoreTrend === null ? "--" : `${selectedScoreTrend >= 0 ? "+" : ""}${selectedScoreTrend}`}</strong>
                                </div>
                            </div>

                            <svg viewBox="0 0 360 180" className={styles.lineChart} role="img" aria-label="認知分趨勢圖">
                                <defs>
                                    <linearGradient id="score-line-fill" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="rgba(76, 174, 255, 0.45)" />
                                        <stop offset="100%" stopColor="rgba(76, 174, 255, 0)" />
                                    </linearGradient>
                                </defs>

                                <g className={styles.lineGrid}>
                                    <line x1="18" y1="20" x2="342" y2="20" />
                                    <line x1="18" y1="60" x2="342" y2="60" />
                                    <line x1="18" y1="100" x2="342" y2="100" />
                                    <line x1="18" y1="140" x2="342" y2="140" />
                                </g>

                                <path
                                    d={`${lineChartPath} L ${lineChartPoints.at(-1)?.x ?? 0} 162 L ${lineChartPoints[0]?.x ?? 0} 162 Z`}
                                    fill="url(#score-line-fill)"
                                    opacity="0.9"
                                />
                                <path d={lineChartPath} className={styles.linePath} />

                                {lineChartPoints.map((point, index) => (
                                    <circle
                                        key={`${point.recordedAt}-${index}`}
                                        cx={point.x}
                                        cy={point.y}
                                        r="4"
                                        className={styles.linePoint}
                                    />
                                ))}
                            </svg>

                            <div className={styles.lineAxis}>
                                <span>{formatDateTime(selectedHistory[0]?.recorded_at ?? null)}</span>
                                <span>{formatDateTime(selectedHistory[selectedHistory.length - 1]?.recorded_at ?? null)}</span>
                            </div>
                        </div>
                    )}
                </article>

                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>最新快照</p>
                            <h3>最新認知分排行</h3>
                        </div>
                        <p className={styles.panelMeta}>{latestScoresSorted.length} 個角色</p>
                    </div>

                    {latestScoresSorted.length === 0 ? (
                        <div className={styles.stateBox}>目前沒有最新認知分資料。</div>
                    ) : (
                        <div className={styles.scoreList}>
                            {latestScoresSorted.map((item) => {
                                const widthRatio = latestScoreMax === 0 ? 0 : item.score / latestScoreMax;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`${styles.scoreRow} ${selectedPid === item.pid ? styles.scoreRowActive : ""}`}
                                        onClick={() => setSelectedPid(item.pid)}
                                    >
                                        <div className={styles.scoreRowTop}>
                                            <strong>角色 {item.pid}</strong>
                                            <span>{item.score}</span>
                                        </div>
                                        <div className={styles.scoreTrack}>
                                            <span className={styles.scoreFill} style={{ width: `${Math.max(widthRatio * 100, 5)}%` }} />
                                        </div>
                                        <small>{formatDateTime(item.recorded_at)}</small>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </article>
            </section>
        </div>
    );
}

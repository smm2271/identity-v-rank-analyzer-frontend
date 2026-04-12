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

import dataDict from "../../../../data.json";

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
    return (dataDict.mode as any)[String(matchType)] ?? `類型 ${matchType}`;
}

function formatCharacter(pid: number | null): string {
    if (pid === null) return "-";
    return (dataDict.character as any)[String(pid)] ?? `角色 ${pid}`;
}

function formatMap(scene_id: number | null): string {
    if (scene_id === null) return "未知";
    return (dataDict as Record<string, any>).map?.[String(scene_id)] ?? `地圖 ${scene_id}`;
}

type PieData = { label: string; value: number; color: string; sublabel?: string };

function RenderPieChart({ data, centerTitle, centerSub }: { data: PieData[]; centerTitle: string; centerSub: string }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return <div className={styles.stateBox}>無資料</div>;
    }

    let cumulative = 0;
    const gradients = data.map((item) => {
        const percent = (item.value / total) * 100;
        const start = cumulative;
        const end = cumulative + percent;
        cumulative = end;
        return `${item.color} ${start}% ${end}%`;
    }).join(", ");

    return (
        <div className={styles.pieContainer}>
            <div className={styles.pieVisual}>
                <div className={styles.pieChart} style={{ background: `conic-gradient(${gradients})` }} />
                <div className={styles.pieCenterText}>
                    <strong>{centerTitle}</strong>
                    <span>{centerSub}</span>
                </div>
            </div>
            <div className={styles.pieLegend}>
                {data.map((item) => (
                    <div key={item.label} className={styles.pieLegendItem}>
                        <div className={styles.pieLegendColor} style={{ backgroundColor: item.color }} />
                        <div className={styles.pieLegendText}>
                            <span>{item.label}</span>
                            <small>{item.value} 場 ({((item.value / total) * 100).toFixed(1)}%) {item.sublabel ?? ""}</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getTopUsed(items: MatchItem[], role: number, limit = 3) {
    const counts: Record<number, number> = {};
    for (const item of items) {
        if (item.utype === role && item.pid !== null) {
            counts[item.pid] = (counts[item.pid] ?? 0) + 1;
        }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, limit).map(([pidStr, count]) => ({
        pid: parseInt(pidStr, 10),
        count
    }));
}

function calculateResults(items: MatchItem[], role: number) {
    let win = 0, tie = 0, loss = 0;
    for (const item of items) {
        if (item.utype !== role || item.match_type === 3 || item.match_type === 10) continue; // Exclude 5v5 code "3" or "10"
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

    const mapCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const item of recentMatches) {
            if (item.scene_id !== null) {
                const key = formatMap(item.scene_id);
                counts[key] = (counts[key] ?? 0) + 1;
            }
        }
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5).reduce((sum, item) => sum + item[1], 0);

        const colors = ["#4D9CFF", "#FF885E", "#FFCA4D", "#9B6BFF", "#4DD2FF", "#7C8CA0"];
        const pieData: PieData[] = top5.map(([label, value], i) => ({
            label, value, color: colors[i % colors.length]
        }));
        if (others > 0) {
            pieData.push({ label: "其他地圖", value: others, color: colors[5] });
        }
        return pieData;
    }, [recentMatches]);

    const topHunters = useMemo(() => getTopUsed(recentMatches, 1), [recentMatches]);
    const topSurvivors = useMemo(() => getTopUsed(recentMatches, 2), [recentMatches]);

    const hunterResults = useMemo(() => calculateResults(recentMatches, 1), [recentMatches]);
    const survivorResults = useMemo(() => calculateResults(recentMatches, 2), [recentMatches]);

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
                                    {formatCharacter(item.pid)}
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
                                    <span>選定角色</span>
                                    <strong>{formatCharacter(selectedPid)}</strong>
                                </div>
                                <div>
                                    <span>最新分數</span>
                                    <strong>{selectedHistory[selectedHistory.length - 1]?.score ?? "-"}</strong>
                                </div>
                                <div>
                                    <span>區間最高</span>
                                    <strong>{scoreBounds.max > 0 ? scoreBounds.max : "-"}</strong>
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
                                            <strong>{formatCharacter(item.pid)}</strong>
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

                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>對局分析</p>
                            <h3>地圖出現比例</h3>
                        </div>
                    </div>
                    {mapCounts.length > 0 ? (
                        <RenderPieChart
                            data={mapCounts}
                            centerTitle="地圖"
                            centerSub={`${mapCounts.reduce((s, i) => s + i.value, 0)} 場`}
                        />
                    ) : (
                        <div className={styles.stateBox}>無地圖資料</div>
                    )}
                </article>

                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>出戰頻率</p>
                            <h3>常用角色 (前三名)</h3>
                        </div>
                    </div>
                    <div className={styles.topCharWrap}>
                        <div className={styles.topCharSection}>
                            <h4>監管陣營</h4>
                            {topHunters.length > 0 ? (
                                <div className={styles.topCharList}>
                                    {topHunters.map((h) => (
                                        <div key={h.pid} className={styles.topCharRow}>
                                            <span>{formatCharacter(h.pid)}</span>
                                            <strong>{h.count} 場</strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.hint} style={{ margin: 0 }}>無監管紀錄</p>
                            )}
                        </div>
                        <div className={styles.topCharSection}>
                            <h4>求生陣營</h4>
                            {topSurvivors.length > 0 ? (
                                <div className={styles.topCharList}>
                                    {topSurvivors.map((s) => (
                                        <div key={s.pid} className={styles.topCharRow}>
                                            <span>{formatCharacter(s.pid)}</span>
                                            <strong>{s.count} 場</strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.hint} style={{ margin: 0 }}>無求生紀錄</p>
                            )}
                        </div>
                    </div>
                </article>

                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>陣營總體</p>
                            <h3>監管對局結果</h3>
                        </div>
                    </div>
                    {hunterResults.total > 0 ? (
                        <RenderPieChart
                            data={[
                                { label: "勝場", value: hunterResults.win, color: "#66C2FF", sublabel: "(3-4殺)" },
                                { label: "平局", value: hunterResults.tie, color: "#9CA4AB", sublabel: "(2殺)" },
                                { label: "敗場", value: hunterResults.loss, color: "#FF7B7B", sublabel: "(0-1殺)" },
                            ].filter((d) => d.value > 0)}
                            centerTitle={hunterResults.total === 0 ? "0%" : `${((hunterResults.win / hunterResults.total) * 100).toFixed(1)}%`}
                            centerSub={`共 ${hunterResults.total} 場`}
                        />
                    ) : (
                        <div className={styles.stateBox}>無監管排位/匹配紀錄</div>
                    )}
                </article>

                <article className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>陣營總體</p>
                            <h3>求生對局結果</h3>
                        </div>
                    </div>
                    {survivorResults.total > 0 ? (
                        <RenderPieChart
                            data={[
                                { label: "勝場", value: survivorResults.win, color: "#66C2FF", sublabel: "(遇0-1跑)" },
                                { label: "平局", value: survivorResults.tie, color: "#9CA4AB", sublabel: "(遇2跑)" },
                                { label: "敗場", value: survivorResults.loss, color: "#FF7B7B", sublabel: "(遇3-4殺)" },
                            ].filter((d) => d.value > 0)}
                            centerTitle={survivorResults.total === 0 ? "0%" : `${((survivorResults.win / survivorResults.total) * 100).toFixed(1)}%`}
                            centerSub={`共 ${survivorResults.total} 場`}
                        />
                    ) : (
                        <div className={styles.stateBox}>無求生排位/匹配紀錄</div>
                    )}
                </article>
            </section>
        </div>
    );
}

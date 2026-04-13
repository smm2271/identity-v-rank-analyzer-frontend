import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../../service/api";
import {
    getMyMatches,
    type MatchItem,
    type MatchListResponse,
} from "../../../service/match.service";
import { useUserAuthStore } from "../../../service/user_auth.service";
import styles from "./dashboard-overview.module.css";

import dataDict from "../../../../data.json";

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
        pid: Number.parseInt(pidStr, 10),
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

function getRoleMatchesWithKillNum(items: MatchItem[], role: number): MatchItem[] {
    return items.filter((item) => {
        if (item.utype !== role) return false;
        if (item.match_type === 3 || item.match_type === 10) return false;
        return item.kill_num !== null;
    });
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
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        let active = true;

        setPageLoading(true);
        setMatchError(null);

        getMyMatches(0, 100)
            .then((response) => {
                if (!active) return;
                setMatches(response);
            })
            .catch((error) => {
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

    const hunterAverageKills = useMemo(() => {
        const hunterMatches = getRoleMatchesWithKillNum(recentMatches, 1);
        if (hunterMatches.length === 0) return null;

        const sum = hunterMatches.reduce((total, item) => total + (item.kill_num ?? 0), 0);
        return sum / hunterMatches.length;
    }, [recentMatches]);

    const survivorEscapeRate = useMemo(() => {
        const survivorMatches = getRoleMatchesWithKillNum(recentMatches, 2);
        if (survivorMatches.length === 0) return null;

        const escapedCount = survivorMatches.reduce((total, item) => {
            const kills = item.kill_num ?? 0;
            const escapedInMatch = Math.max(0, Math.min(4, 4 - kills));
            return total + escapedInMatch;
        }, 0);

        const totalSlots = survivorMatches.length * 4;
        if (totalSlots === 0) return null;
        return (escapedCount / totalSlots) * 100;
    }, [recentMatches]);

    return (
        <div className={styles.page}>

            {matchError && (
                <section className={styles.noticeStack}>
                    {matchError && <div className={`${styles.stateBox} ${styles.stateError}`}>{matchError}</div>}
                </section>
            )}

            <section className={styles.metricGrid}>
                <article className={`${styles.metricCard} ${styles.cardTotalMatches}`}>
                    <p className={styles.label}>總場次</p>
                    <p className={styles.value}>{pageLoading && matches === null ? "載入中..." : totalMatches.toLocaleString("zh-TW")}</p>
                </article>

                <article className={`${styles.metricCard} ${styles.metricCardHunter} ${styles.cardHunterAverageKill}`}>
                    <p className={styles.label}>監管平均淘汰數</p>
                    <p className={styles.value}>{hunterAverageKills === null ? "--" : hunterAverageKills.toFixed(1)}</p>
                </article>

                <article className={`${styles.metricCard} ${styles.metricCardSurvivor} ${styles.cardSurvivorEscapeRate}`}>
                    <p className={styles.label}>求生逃脫率</p>
                    <p className={styles.value}>{survivorEscapeRate === null ? "--" : `${survivorEscapeRate.toFixed(1)}%`}</p>
                </article>
            </section>

            <section className={styles.chartGrid}>
                <article className={`${styles.panel} ${styles.cardModeDistribution}`}>
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
                                    <span>最常遊玩的模式</span>
                                    <strong>
                                        {topMatchType.label} · {topMatchType.value} 場
                                    </strong>
                                </div>
                            )}
                        </div>
                    )}
                </article>

                <article className={`${styles.panel} ${styles.cardMapDistribution}`}>
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

                <article className={`${styles.panel} ${styles.roleThemeHunter} ${styles.cardHunterTopRoles}`}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>出戰頻率</p>
                            <h3>常用監管角色 (前三名)</h3>
                        </div>
                    </div>
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
                </article>

                <article className={`${styles.panel} ${styles.roleThemeSurvivor} ${styles.cardSurvivorTopRoles}`}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>出戰頻率</p>
                            <h3>常用求生角色 (前三名)</h3>
                        </div>
                    </div>
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
                </article>

                <article className={`${styles.panel} ${styles.roleThemeHunter} ${styles.cardHunterResults}`}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>陣營總體</p>
                            <h3>監管對局結果</h3>
                        </div>
                    </div>
                    {hunterResults.total > 0 ? (
                        <RenderPieChart
                            data={[
                                { label: "勝利", value: hunterResults.win, color: "#ffdb84"},
                                { label: "平局", value: hunterResults.tie, color: "#e0dfdd"},
                                { label: "失敗", value: hunterResults.loss, color: "#ff8c7f"},
                            ].filter((d) => d.value > 0)}
                            centerTitle={hunterResults.total === 0 ? "0%" : `${((hunterResults.win / hunterResults.total) * 100).toFixed(1)}%`}
                            centerSub={`共 ${hunterResults.total} 場`}
                        />
                    ) : (
                        <div className={styles.stateBox}>無監管排位/匹配紀錄</div>
                    )}
                </article>

                <article className={`${styles.panel} ${styles.roleThemeSurvivor} ${styles.cardSurvivorResults}`}>
                    <div className={styles.panelHeader}>
                        <div>
                            <p className={styles.panelKicker}>陣營總體</p>
                            <h3>求生對局結果</h3>
                        </div>
                    </div>
                    {survivorResults.total > 0 ? (
                        <RenderPieChart
                            data={[
                                { label: "勝利", value: survivorResults.win, color: "#ffdb84"},
                                { label: "平局", value: survivorResults.tie, color: "#e0dfdd"},
                                { label: "失敗", value: survivorResults.loss, color: "#ff8c7f"},
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

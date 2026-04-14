import { useState } from "react";
import styles from "./dashboard-overview.module.css";

// Hooks
import { useDashboardData } from "./hooks/useDashboardData";
import { useDashboardLayout } from "./hooks/useDashboardLayout";

// Components
import { PieChart } from "./components/PieChart";
import { CardSelector } from "./components/CardSelector";
import { MetricCard, PanelCard } from "./components/DashboardCards";

// Utils
import { formatCharacter } from "./utils/formatters";

export default function DashboardOverviewPage() {
    const { stats, pageLoading, matchError, hasMatches } = useDashboardData();
    const { 
        visibleCards, 
        cardOrder, 
        orderedMetricCards, 
        orderedPanelCards, 
        draggedCard, 
        handleCardToggle, 
        getDragProps 
    } = useDashboardLayout();

    const [showCardSelector, setShowCardSelector] = useState(false);

    return (
        <div className={styles.page}>
            {matchError && (
                <section className={styles.noticeStack}>
                    <div className={`${styles.stateBox} ${styles.stateError}`}>{matchError}</div>
                </section>
            )}

            <div className={styles.dashboardHeader}>
                <button
                    type="button"
                    className={styles.cardSelectorToggle}
                    onClick={() => setShowCardSelector(!showCardSelector)}
                >
                    ⚙️ 選擇卡片
                </button>
            </div>

            <CardSelector
                show={showCardSelector}
                onClose={() => setShowCardSelector(false)}
                visibleCards={visibleCards}
                onToggle={handleCardToggle}
                orderMetric={orderedMetricCards}
                orderPanel={orderedPanelCards}
                getDragProps={getDragProps}
                draggedCard={draggedCard}
                styles={styles}
            />

            {orderedMetricCards.some((key) => visibleCards.has(key)) && (
                <section className={styles.metricGrid}>
                    {orderedMetricCards.map((key) => {
                        if (!visibleCards.has(key)) return null;
                        const order = cardOrder.indexOf(key);

                        if (key === 'totalMatches') {
                            return (
                                <MetricCard
                                    key={key} id={key} label="總場次" order={order}
                                    value={pageLoading && !hasMatches ? "載入中..." : stats.totalMatches.toLocaleString("zh-TW")}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={styles.cardTotalMatches}
                                />
                            );
                        }
                        if (key === 'hunterAvgKill') {
                            return (
                                <MetricCard
                                    key={key} id={key} label="監管平均淘汰數" order={order}
                                    value={stats.hunterAverageKills === null ? "--" : stats.hunterAverageKills.toFixed(1)}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={`${styles.metricCardHunter} ${styles.cardHunterAverageKill}`}
                                />
                            );
                        }
                        if (key === 'survivorEscapeRate') {
                            return (
                                <MetricCard
                                    key={key} id={key} label="求生逃脫率" order={order}
                                    value={stats.survivorEscapeRate === null ? "--" : `${stats.survivorEscapeRate.toFixed(1)}%`}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={`${styles.metricCardSurvivor} ${styles.cardSurvivorEscapeRate}`}
                                />
                            );
                        }
                        return null;
                    })}
                </section>
            )}

            {orderedPanelCards.some((key) => visibleCards.has(key)) && (
                <section className={styles.chartGrid}>
                    {orderedPanelCards.map((key) => {
                        if (!visibleCards.has(key)) return null;
                        const order = cardOrder.indexOf(key);

                        if (key === 'modeDistribution') {
                            return (
                                <PanelCard
                                    key={key} id={key} kicker="對戰概況" title="對戰模式分布" order={order}
                                    meta={`最近 ${stats.loadedMatchCount} 場`}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={styles.cardModeDistribution}
                                >
                                    {stats.loadedMatchCount === 0 ? (
                                        <div className={styles.stateBox}>目前沒有可視化資料，請先載入對戰紀錄。</div>
                                    ) : (
                                        <div className={styles.modeChart} aria-label="對戰模式分布圖表">
                                            {Object.entries(stats.matchCounts)
                                                .sort((left, right) => right[1] - left[1])
                                                .map(([label, count]) => {
                                                    const ratio = stats.loadedMatchCount === 0 ? 0 : count / stats.loadedMatchCount;
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
                                            {stats.topMatchType && (
                                                <div className={styles.modeSummary}>
                                                    <span>最常遊玩的模式</span>
                                                    <strong>{stats.topMatchType.label} · {stats.topMatchType.value} 場</strong>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </PanelCard>
                            );
                        }

                        if (key === 'mapDistribution') {
                            return (
                                <PanelCard
                                    key={key} id={key} kicker="對局分析" title="地圖出現比例" order={order}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={styles.cardMapDistribution}
                                >
                                    {stats.mapCounts.length > 0 ? (
                                        <PieChart data={stats.mapCounts} centerTitle="地圖" centerSub={`${stats.mapCounts.reduce((s, i) => s + i.value, 0)} 場`} styles={styles} />
                                    ) : (
                                        <div className={styles.stateBox}>無地圖資料</div>
                                    )}
                                </PanelCard>
                            );
                        }

                        if (key === 'hunterTopRoles') {
                            return (
                                <PanelCard
                                    key={key} id={key} kicker="出戰頻率" title="常用監管角色 (前三名)" order={order}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={`${styles.roleThemeHunter} ${styles.cardHunterTopRoles}`}
                                >
                                    {stats.topHunters.length > 0 ? (
                                        <div className={styles.topCharList}>
                                            {stats.topHunters.map((h) => (
                                                <div key={h.pid} className={styles.topCharRow}>
                                                    <span>{formatCharacter(h.pid)}</span>
                                                    <strong>{h.count} 場</strong>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.hint} style={{ margin: 0 }}>無監管紀錄</p>
                                    )}
                                </PanelCard>
                            );
                        }

                        if (key === 'survivorTopRoles') {
                            return (
                                <PanelCard
                                    key={key} id={key} kicker="出戰頻率" title="常用求生角色 (前三名)" order={order}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={`${styles.roleThemeSurvivor} ${styles.cardSurvivorTopRoles}`}
                                >
                                    {stats.topSurvivors.length > 0 ? (
                                        <div className={styles.topCharList}>
                                            {stats.topSurvivors.map((s) => (
                                                <div key={s.pid} className={styles.topCharRow}>
                                                    <span>{formatCharacter(s.pid)}</span>
                                                    <strong>{s.count} 場</strong>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.hint} style={{ margin: 0 }}>無求生紀錄</p>
                                    )}
                                </PanelCard>
                            );
                        }

                        if (key === 'hunterResults') {
                            return (
                                <PanelCard
                                    key={key} id={key} kicker="陣營總體" title="監管對局結果" order={order}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={`${styles.roleThemeHunter} ${styles.cardHunterResults}`}
                                >
                                    {stats.hunterResults.total > 0 ? (
                                        <PieChart
                                            data={[
                                                { label: "勝利", value: stats.hunterResults.win, color: "#ffdb84"},
                                                { label: "平局", value: stats.hunterResults.tie, color: "#e0dfdd"},
                                                { label: "失敗", value: stats.hunterResults.loss, color: "#ff8c7f"},
                                            ].filter((d) => d.value > 0)}
                                            centerTitle={stats.hunterResults.total === 0 ? "0%" : `${((stats.hunterResults.win / stats.hunterResults.total) * 100).toFixed(1)}%`}
                                            centerSub={`共 ${stats.hunterResults.total} 場`}
                                            styles={styles}
                                        />
                                    ) : (
                                        <div className={styles.stateBox}>無監管排位/匹配紀錄</div>
                                    )}
                                </PanelCard>
                            );
                        }

                        if (key === 'survivorResults') {
                            return (
                                <PanelCard
                                    key={key} id={key} kicker="陣營總體" title="求生對局結果" order={order}
                                    getDragProps={getDragProps} draggedCard={draggedCard} styles={styles}
                                    className={`${styles.roleThemeSurvivor} ${styles.cardSurvivorResults}`}
                                >
                                    {stats.survivorResults.total > 0 ? (
                                        <PieChart
                                            data={[
                                                { label: "勝利", value: stats.survivorResults.win, color: "#ffdb84"},
                                                { label: "平局", value: stats.survivorResults.tie, color: "#e0dfdd"},
                                                { label: "失敗", value: stats.survivorResults.loss, color: "#ff8c7f"},
                                            ].filter((d) => d.value > 0)}
                                            centerTitle={stats.survivorResults.total === 0 ? "0%" : `${((stats.survivorResults.win / stats.survivorResults.total) * 100).toFixed(1)}%`}
                                            centerSub={`共 ${stats.survivorResults.total} 場`}
                                            styles={styles}
                                        />
                                    ) : (
                                        <div className={styles.stateBox}>無求生排位/匹配紀錄</div>
                                    )}
                                </PanelCard>
                            );
                        }

                        return null;
                    })}
                </section>
            )}
        </div>
    );
}

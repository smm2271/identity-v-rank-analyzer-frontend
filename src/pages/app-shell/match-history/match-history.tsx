import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { ApiError } from "../../../service/api";
import { getMyMatches, getMatchDetail, type MatchItem, type MatchDetailResponse } from "../../../service/match.service";
import styles from "./match-history.module.css";

import dataDict from "../../../../data.json";

const characterLookup = {
    ...((dataDict as any).character?.hunter ?? {}),
    ...((dataDict as any).character?.survivor ?? {}),
} as Record<string, string>;

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

function formatRole(utype: number | null): string {
    if (utype === null) return "未知";
    // 1: 監管, 2: 求生 (Usually Identity-V specific utype encoding)
    return utype === 1 ? "監管" : utype === 2 ? "求生" : `陣營 ${utype}`;
}

function formatCharacter(pid: number | null): string {
    if (pid === null) return "-";
    return characterLookup[String(pid)] ?? `角色 ${pid}`;
}

function formatMap(scene_id: number | null): string {
    if (scene_id === null) return "未知";
    return (dataDict as Record<string, any>).map?.[String(scene_id)] ?? `地圖 ${scene_id}`;
}

function formatPlayerResType(resType: number | null, killNum: number | null): string {
    if (resType !== null && (dataDict as any).res_type) {
        for (const [label, values] of Object.entries((dataDict as any).res_type)) {
            if (Array.isArray(values) && values.includes(resType)) {
                return label;
            }
        }
    }
    
    // 如果對不上 dataDict 的逃脫/迷失，推定為監管者，用 killNum 計算大獲全勝等
    if (killNum !== null) {
        if (killNum >= 3) return "大獲全勝";
        if (killNum === 2) return "勉強獲勝";
        return "一敗塗地";
    }

    return resType === null ? "" : String(resType);
}

function isPlayerHunter(resType: number | null): boolean {
    if (resType !== null && (dataDict as any).res_type) {
        for (const values of Object.values((dataDict as any).res_type)) {
            if (Array.isArray(values) && values.includes(resType)) {
                return false;
            }
        }
    }
    return true; // Not mapped to survivor means it's the hunter
}

export default function MatchHistoryPage() {
    const [items, setItems] = useState<MatchItem[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [matchDetails, setMatchDetails] = useState<Record<string, MatchDetailResponse>>({});
    const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
    const [modeFilter, setModeFilter] = useState<string>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [characterKeyword, setCharacterKeyword] = useState("");
    const [sortBy, setSortBy] = useState<"timeDesc" | "timeAsc" | "killDesc" | "killAsc">("timeDesc");
    const [showFilters, setShowFilters] = useState(false);
    const tableWrapRef = useRef<HTMLDivElement | null>(null);
    const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

    function toggleExpand(id: string) {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        if (!matchDetails[id] && !loadingDetails.has(id)) {
            setLoadingDetails((l) => new Set(l).add(id));
            getMatchDetail(id)
                .then((detail) => {
                    setMatchDetails((prevDetails) => ({ ...prevDetails, [id]: detail }));
                })
                .catch(console.error)
                .finally(() => {
                    setLoadingDetails((l) => {
                        const nl = new Set(l);
                        nl.delete(id);
                        return nl;
                    });
                });
        }
    }

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        getMyMatches(offset, limit)
            .then((res) => {
                if (!active) return;
                setItems(res.items);
                setTotal(res.total);
            })
            .catch((err) => {
                if (!active) return;
                if (err instanceof ApiError) {
                    setError(err.detail);
                } else {
                    setError("讀取歷史戰績失敗，請稍後再試");
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [offset, limit]);

    const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
    const hasPrev = offset > 0;
    const hasNext = offset + limit < total;

    const modeFilterOptions = useMemo(() => {
        const options = Array.from(new Set(items.map((item) => formatMatchType(item.match_type))));
        return options.sort((a, b) => a.localeCompare(b, "zh-TW"));
    }, [items]);

    const filteredAndSortedItems = useMemo(() => {
        const keyword = characterKeyword.trim().toLowerCase();

        const filtered = items.filter((item) => {
            if (modeFilter !== "all" && formatMatchType(item.match_type) !== modeFilter) return false;

            if (roleFilter !== "all") {
                const targetRole = roleFilter === "hunter" ? 1 : 2;
                if (item.utype !== targetRole) return false;
            }

            if (keyword) {
                const characterName = formatCharacter(item.pid).toLowerCase();
                if (!characterName.includes(keyword)) return false;
            }

            return true;
        });

        return filtered.sort((a, b) => {
            const dateA = new Date(a.game_save_time ?? a.created_at ?? 0).getTime();
            const dateB = new Date(b.game_save_time ?? b.created_at ?? 0).getTime();
            const killA = a.kill_num ?? -1;
            const killB = b.kill_num ?? -1;

            if (sortBy === "timeAsc") return dateA - dateB;
            if (sortBy === "killDesc") return killB - killA;
            if (sortBy === "killAsc") return killA - killB;
            return dateB - dateA;
        });
    }, [items, modeFilter, roleFilter, characterKeyword, sortBy]);

    useEffect(() => {
        if (!expandedId) return;
        const exists = filteredAndSortedItems.some((item) => item.id === expandedId);
        if (!exists) {
            setExpandedId(null);
        }
    }, [expandedId, filteredAndSortedItems]);

    useEffect(() => {
        if (!expandedId) return;

        const wrapEl = tableWrapRef.current;
        const rowEl = rowRefs.current[expandedId];
        if (!wrapEl || !rowEl) return;

        const headerEl = wrapEl.querySelector("thead") as HTMLElement | null;
        const stickyHeaderHeight = headerEl?.offsetHeight ?? 0;
        const targetTop = rowEl.offsetTop - stickyHeaderHeight;

        wrapEl.scrollTo({
            top: Math.max(0, targetTop),
            behavior: "smooth",
        });
    }, [expandedId]);

    function goPrev() {
        if (!hasPrev) return;
        setOffset((prev) => Math.max(0, prev - limit));
    }

    function goNext() {
        if (!hasNext) return;
        setOffset((prev) => prev + limit);
    }

    function handleLimitChange(nextLimit: number) {
        setLimit(nextLimit);
        setOffset(0);
    }

    function handleResetFilters() {
        setModeFilter("all");
        setRoleFilter("all");
        setCharacterKeyword("");
        setSortBy("timeDesc");
        setExpandedId(null);
    }

    return (
        <div className={styles.panel}>
            <div className={styles.toolbar}>
                <div>
                    <h2>歷史戰績</h2>
                    <p>本頁已載入 {items.length} 筆，篩選後 {filteredAndSortedItems.length} 筆，本帳號總計 {total} 筆。</p>
                </div>

                <label className={styles.limitSelector} htmlFor="limit-select">
                    每頁筆數
                    <select
                        id="limit-select"
                        value={limit}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </label>
            </div>

            <div className={styles.filterToggleRow}>
                <button
                    type="button"
                    className={styles.filterToggleButton}
                    onClick={() => setShowFilters((prev) => !prev)}
                    aria-expanded={showFilters}
                >
                    {showFilters ? "收合篩選器" : "展開篩選器"}
                </button>
            </div>

            {showFilters && (
            <div className={styles.filterBar}>
                <label className={styles.filterItem} htmlFor="mode-filter-select">
                    模式篩選
                    <select
                        id="mode-filter-select"
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                    >
                        <option value="all">全部模式</option>
                        {modeFilterOptions.map((mode) => (
                            <option key={mode} value={mode}>{mode}</option>
                        ))}
                    </select>
                </label>

                <label className={styles.filterItem} htmlFor="role-filter-select">
                    陣營篩選
                    <select
                        id="role-filter-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">全部陣營</option>
                        <option value="hunter">監管</option>
                        <option value="survivor">求生</option>
                    </select>
                </label>

                <label className={styles.filterItem} htmlFor="character-keyword-input">
                    按關鍵字搜尋角色
                    <input
                        id="character-keyword-input"
                        type="text"
                        value={characterKeyword}
                        onChange={(e) => setCharacterKeyword(e.target.value)}
                        placeholder="輸入角色名稱"
                    />
                </label>

                <label className={styles.filterItem} htmlFor="sort-by-select">
                    排序
                    <select
                        id="sort-by-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "timeDesc" | "timeAsc" | "killDesc" | "killAsc")}
                    >
                        <option value="timeDesc">時間：新到舊</option>
                        <option value="timeAsc">時間：舊到新</option>
                        <option value="killDesc">淘汰人數：高到低</option>
                        <option value="killAsc">淘汰人數：低到高</option>
                    </select>
                </label>

                <div className={styles.filterResetWrap}>
                    <button
                        type="button"
                        className={styles.filterResetButton}
                        onClick={handleResetFilters}
                    >
                        重設
                    </button>
                </div>
            </div>
            )}

            {loading && <div className={styles.stateBox}>讀取中...</div>}
            {!loading && error && <div className={`${styles.stateBox} ${styles.stateError}`}>{error}</div>}

            {!loading && !error && filteredAndSortedItems.length === 0 && (
                <div className={styles.stateBox}>目前還沒有對戰紀錄，先上傳一場來看看。</div>
            )}

            {!loading && !error && filteredAndSortedItems.length > 0 && (
                <div ref={tableWrapRef} className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>對戰時間</th>
                                <th>模式</th>
                                <th>陣營</th>
                                <th>使用角色</th>
                                <th>淘汰人數</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedItems.map((match) => (
                                <Fragment key={match.id}>
                                    <tr 
                                        className={`${styles.tableRow} ${expandedId === match.id ? styles.tableRowActive : ""}`} 
                                        onClick={() => toggleExpand(match.id)}
                                        style={{ cursor: "pointer" }}
                                        ref={(el) => {
                                            rowRefs.current[match.id] = el;
                                        }}
                                    >
                                        <td>{formatDateTime(match.game_save_time ?? match.created_at)}</td>
                                        <td>{formatMatchType(match.match_type)}</td>
                                        <td>{formatRole(match.utype)}</td>
                                        <td>{formatCharacter(match.pid)}</td>
                                        <td>{match.kill_num ?? "-"}</td>
                                    </tr>
                                    {expandedId === match.id && (
                                        <tr className={styles.expandedRow}>
                                            <td colSpan={5}>
                                                <div className={styles.expandedContent}>
                                                    <h4>對局詳細資訊</h4>
                                                    <div className={styles.expandedGrid}>
                                                        <div>
                                                            <span>使用角色</span>
                                                            <strong>{formatCharacter(match.pid)}</strong>
                                                        </div>
                                                        <div>
                                                            <span>對戰地圖</span>
                                                            <strong>{formatMap(match.scene_id)}</strong>
                                                        </div>
                                                        <div>
                                                            <span>資料建立時間</span>
                                                            <strong>{formatDateTime(match.created_at)}</strong>
                                                        </div>
                                                    </div>
                                                    
                                                        {(() => {
                                                            let cipherData: number[] = [];
                                                            if (match.cipher_progress) {
                                                                if (Array.isArray(match.cipher_progress)) {
                                                                    cipherData = match.cipher_progress.map(Number);
                                                                } else {
                                                                    Object.values(match.cipher_progress).forEach(val => {
                                                                        if (Array.isArray(val)) {
                                                                            cipherData.push(...val.map(Number));
                                                                        } else {
                                                                            cipherData.push(Number(val));
                                                                        }
                                                                    });
                                                                }
                                                            }

                                                            const validCiphers = cipherData.filter(v => v >= 0 && !Number.isNaN(v));
                                                            if (validCiphers.length === 0) return null;

                                                            let normalized = validCiphers;
                                                            const highest = Math.max(...validCiphers, 0);
                                                            if (highest > 0 && highest <= 1.0) {
                                                                normalized = validCiphers.map(v => v * 100);
                                                            }

                                                            const maxProg = Math.max(...normalized, 100);

                                                            return (
                                                                <div className={styles.cipherSection}>
                                                                    <h5>密碼機進度</h5>
                                                                    <div className={styles.cipherGrid}>
                                                                        {normalized.map((val, index) => {
                                                                            const percent = (val / maxProg) * 100;
                                                                            return (
                                                                                <div key={index} className={styles.cipherItem}>
                                                                                    <div className={styles.cipherLabel}>
                                                                                        <span className={styles.cipherKey}>密碼機 {index + 1}</span>
                                                                                        <strong className={styles.cipherVal}>{Math.round(val)}%</strong>
                                                                                    </div>
                                                                                    <div className={styles.cipherBarBg}>
                                                                                        <div className={styles.cipherTrack} style={{ '--target-width': `${percent}%` } as React.CSSProperties} />
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                    {loadingDetails.has(match.id) ? (
                                                        <p className={styles.detailLoading}>正在載入同局玩家資訊...</p>
                                                    ) : matchDetails[match.id]?.players && matchDetails[match.id].players.length > 0 && (
                                                        <div className={styles.playersSection}>
                                                            <h5>同局玩家</h5>
                                                            <div className={styles.playersGrid}>
                                                                {[...matchDetails[match.id].players]
                                                                    .sort((a, b) => {
                                                                        const aH = isPlayerHunter(a.res_type);
                                                                        const bH = isPlayerHunter(b.res_type);
                                                                        if (aH && !bH) return -1;
                                                                        if (!aH && bH) return 1;
                                                                        return 0;
                                                                    })
                                                                    .map(player => {
                                                                        const isHunter = isPlayerHunter(player.res_type);
                                                                        return (
                                                                            <div key={player.id} className={`${styles.playerCard} ${isHunter ? styles.playerCardHunter : styles.playerCardSurvivor}`}>
                                                                                <div className={styles.playerRoleWrap}>
                                                                                    <strong className={styles.playerRole}>{formatCharacter(player.character_id)}</strong>
                                                                                    <span className={styles.playerResType}>{formatPlayerResType(player.res_type, match.kill_num)}</span>
                                                                                </div>
                                                                                <span className={styles.playerName}>{player.player_name || "匿名玩家"}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.pagination}>
                <button type="button" onClick={goPrev} disabled={!hasPrev || loading}>
                    上一頁
                </button>
                <span>
                    第 {currentPage} / {totalPages} 頁
                </span>
                <button type="button" onClick={goNext} disabled={!hasNext || loading}>
                    下一頁
                </button>
            </div>
        </div>
    );
}

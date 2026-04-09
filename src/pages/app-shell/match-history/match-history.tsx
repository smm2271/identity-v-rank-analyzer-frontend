import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../../service/api";
import { getMyMatches, type MatchItem } from "../../../service/match.service";
import styles from "./match-history.module.css";

const MATCH_TYPE_LABEL: Record<number, string> = {
    1: "排位",
    2: "匹配",
    3: "五人制",
};

const UTYPE_LABEL: Record<number, string> = {
    1: "監管",
    2: "求生",
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

function formatRole(utype: number | null): string {
    if (utype === null) return "未知";
    return UTYPE_LABEL[utype] ?? `角色 ${utype}`;
}

export default function MatchHistoryPage() {
    const [items, setItems] = useState<MatchItem[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className={styles.panel}>
            <div className={styles.toolbar}>
                <div>
                    <h2>歷史戰績</h2>
                    <p>已載入 {items.length} 筆，本帳號總計 {total} 筆。</p>
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

            {loading && <div className={styles.stateBox}>讀取中...</div>}
            {!loading && error && <div className={`${styles.stateBox} ${styles.stateError}`}>{error}</div>}

            {!loading && !error && items.length === 0 && (
                <div className={styles.stateBox}>目前還沒有對戰紀錄，先上傳一場來看看。</div>
            )}

            {!loading && !error && items.length > 0 && (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>對戰時間</th>
                                <th>模式</th>
                                <th>角色定位</th>
                                <th>角色 ID</th>
                                <th>擊殺</th>
                                <th>段位</th>
                                <th>房間 UUID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((match) => (
                                <tr key={match.id}>
                                    <td>{formatDateTime(match.game_save_time ?? match.created_at)}</td>
                                    <td>{formatMatchType(match.match_type)}</td>
                                    <td>{formatRole(match.utype)}</td>
                                    <td>{match.pid ?? "-"}</td>
                                    <td>{match.kill_num ?? "-"}</td>
                                    <td>{match.rank_level ?? "-"}</td>
                                    <td className={styles.uuid}>{match.room_guuid}</td>
                                </tr>
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

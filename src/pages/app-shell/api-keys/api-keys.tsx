import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../../service/api";
import {
    createMyApiKey,
    deactivateMyApiKey,
    getMyApiKeys,
    type ApiKeyListItem,
} from "../../../service/api-key.service";
import styles from "./api-keys.module.css";

function formatDateTime(value: string | null): string {
    if (!value) return "尚未使用";

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

export default function ApiKeysPage() {
    const [items, setItems] = useState<ApiKeyListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState("");
    const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);

    async function loadKeys() {
        setLoading(true);
        setError(null);

        try {
            const result = await getMyApiKeys();
            setItems(result);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("讀取 API Keys 失敗，請稍後再試");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadKeys();
    }, []);

    const activeCount = useMemo(() => items.filter((item) => item.is_active).length, [items]);

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        setError(null);
        setJustCreatedKey(null);

        try {
            const payload = nameInput.trim() ? { name: nameInput.trim() } : {};
            const result = await createMyApiKey(payload);
            setJustCreatedKey(result.api_key);
            setNameInput("");
            await loadKeys();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("建立 API Key 失敗，請稍後再試");
            }
        } finally {
            setCreating(false);
        }
    }

    async function handleRevoke(id: string) {
        setRevokingId(id);
        setError(null);

        try {
            await deactivateMyApiKey(id);
            await loadKeys();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail);
            } else {
                setError("停用 API Key 失敗，請稍後再試");
            }
        } finally {
            setRevokingId(null);
        }
    }

    async function copyCreatedKey() {
        if (!justCreatedKey) return;
        await navigator.clipboard.writeText(justCreatedKey);
    }

    return (
        <div className={styles.page}>
            <section className={styles.heroCard}>
                <div>
                    <p className={styles.kicker}>API 金鑰中心</p>
                    <h2>申請與管理你的 API Keys</h2>
                    <p className={styles.description}>
                        這裡只接受 Bearer 驗證申請。明文金鑰只在建立當下顯示一次，請立即保存。
                    </p>
                </div>
                <div className={styles.stats}>
                    <div>
                        <span>總數</span>
                        <strong>{items.length}</strong>
                    </div>
                    <div>
                        <span>啟用中</span>
                        <strong>{activeCount}</strong>
                    </div>
                </div>
            </section>

            <section className={styles.panel}>
                <h3>申請新 API Key</h3>
                <form className={styles.form} onSubmit={handleCreate}>
                    <label htmlFor="api-key-name">顯示名稱（選填）</label>
                    <input
                        id="api-key-name"
                        type="text"
                        maxLength={50}
                        placeholder="例如：桌面上傳器"
                        value={nameInput}
                        onChange={(event) => setNameInput(event.target.value)}
                    />
                    <button type="submit" disabled={creating}>
                        {creating ? "建立中..." : "建立 API Key"}
                    </button>
                </form>

                {justCreatedKey && (
                    <div className={styles.createdBox}>
                        <p className={styles.createdTitle}>新金鑰（只顯示這一次）</p>
                        <code>{justCreatedKey}</code>
                        <button type="button" onClick={copyCreatedKey}>複製</button>
                    </div>
                )}
            </section>

            <section className={styles.panel}>
                <div className={styles.listHeader}>
                    <h3>我的 API Keys</h3>
                    <button type="button" onClick={() => void loadKeys()} disabled={loading}>
                        {loading ? "更新中..." : "重新整理"}
                    </button>
                </div>

                {error && <div className={styles.errorBox}>{error}</div>}

                {!error && items.length === 0 && !loading && (
                    <div className={styles.emptyBox}>目前尚未建立 API Key。</div>
                )}

                {items.length > 0 && (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>名稱</th>
                                    <th>狀態</th>
                                    <th>建立時間</th>
                                    <th>最後使用</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.name ?? "未命名 Key"}</td>
                                        <td>
                                            <span className={item.is_active ? styles.activeTag : styles.inactiveTag}>
                                                {item.is_active ? "啟用" : "停用"}
                                            </span>
                                        </td>
                                        <td>{formatDateTime(item.created_at)}</td>
                                        <td>{formatDateTime(item.last_used_at)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className={styles.revokeBtn}
                                                disabled={!item.is_active || revokingId === item.id}
                                                onClick={() => void handleRevoke(item.id)}
                                            >
                                                {revokingId === item.id ? "停用中..." : "停用"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

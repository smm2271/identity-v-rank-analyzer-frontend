import styles from "./dashboard-overview.module.css";

export default function DashboardOverviewPage() {
    return (
        <div className={styles.page}>
            <section className={styles.heroCard}>
                <h2>總儀表板</h2>
                <p>一手掌握全局</p>
            </section>

            <section className={styles.grid}>
                <article className={styles.card}>
                    <p className={styles.label}>本週總場次</p>
                    <p className={styles.value}>--</p>
                    <p className={styles.hint}>將在串接聚合 API 後顯示</p>
                </article>
                <article className={styles.card}>
                    <p className={styles.label}>最近角色勝率</p>
                    <p className={styles.value}>--%</p>
                    <p className={styles.hint}>待分析模組啟用</p>
                </article>
                <article className={styles.card}>
                    <p className={styles.label}>認知分趨勢</p>
                    <p className={styles.value}>--</p>
                    <p className={styles.hint}>下一階段加入圖表</p>
                </article>
            </section>
        </div>
    );
}

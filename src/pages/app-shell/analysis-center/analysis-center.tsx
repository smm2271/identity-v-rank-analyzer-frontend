import { Link, useSearchParams } from "react-router-dom";
import styles from "./analysis-center.module.css";

type AnalysisCard = {
    key: string;
    title: string;
    description: string;
    chartPlan: string;
    queryValue: string;
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
        description: "觀察常見對戰組合、相剋關係與搭配勝率。",
        chartPlan: "勝率熱力圖 + 群組長條圖",
        queryValue: "lineup-analysis",
    },
    {
        key: "map-character",
        title: "地圖 x 角色交叉",
        description: "比較同角色在不同地圖上的表現差異。",
        chartPlan: "交叉熱力圖 + 氣泡圖",
        queryValue: "map-character",
    },
];

export default function AnalysisCenterPage() {
    const [searchParams] = useSearchParams();
    const highlighted = searchParams.get("view");

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
                            <button type="button" className={styles.comingSoon}>
                                子頁規劃中
                            </button>
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

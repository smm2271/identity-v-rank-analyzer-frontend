import PublicNav from "../../../share/public-nav/public-nav";
import styles from "./features.module.css";

export default function Features() {
    return (
        <div className={styles.pageContainer}>
            <PublicNav />

            <main className={styles.mainContent}>
                <header className={styles.heroBlock}>
                    <p className={styles.badge}>Feature Overview</p>
                    <h1 className={styles.title}>功能介紹</h1>
                    <p className={styles.subtitle}>
                        從對局錄像擷取資料，到視覺化分析與身份趨勢比較，協助你更快掌握自己的打法盲點與成長方向。
                    </p>
                </header>

                <section className={styles.featureGrid}>
                    <article className={styles.card}>
                        <h2>戰績解析</h2>
                        <p>自動整理每場對局的角色、陣營、結果與關鍵資訊，快速建立可比較的個人資料集。</p>
                    </article>

                    <article className={styles.card}>
                        <h2>身份勝率比較</h2>
                        <p>分開查看求生者與監管者的勝率、場次與趨勢，找出你在不同身份下的穩定度差異。</p>
                    </article>

                    <article className={styles.card}>
                        <h2>版本觀察與決策</h2>
                        <p>透過長期資料紀錄，觀察角色使用偏好與版本變化，支援日常排位與 BP 判斷。</p>
                    </article>
                </section>

                <section className={styles.card}>
                    <h2>使用流程</h2>
                    <ol className={styles.flowList}>
                        <li>Client 工具監聽並解析本機錄像資料</li>
                        <li>資料同步至後端進行清洗與儲存</li>
                        <li>前端儀表板即時呈現統計與趨勢圖</li>
                    </ol>
                </section>

                <section className={styles.card}>
                    <h2>近期規劃</h2>
                    <p>即將加入角色池偏好分析、地圖勝率切片與更細緻的時間軸檢視，讓數據回饋更有行動價值。</p>
                </section>
            </main>
        </div>
    );
}
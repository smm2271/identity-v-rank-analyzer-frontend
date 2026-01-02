import styles from '../docs.module.css';

export default function Disclaimer() {
    return (
        <div className={styles.container}>
            <article className={styles.content}>
                <header className={styles.header}>
                    <h1>法律免責聲明</h1>
                    <p className={styles.subtitle}>Legal Disclaimer</p>
                    <p className={styles.intro}>本文件為《服務條款（Terms of Service）》之補充文件。</p>
                </header>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="official">一、與遊戲官方關係聲明</h2>
                    <p>本專案與《第五人格》官方（網易 NetEase）<strong>無任何合作、授權、認可或隸屬關係</strong>。</p>
                    <p>本工具不代表官方立場，亦不代表官方工具。</p>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="source">二、資料來源與解析限制</h2>
                    <p>本服務僅離線解析 <strong>遊戲客戶端於使用者本機資料目錄中自動產生之對局錄像</strong>，不涉及即時資料擷取、封包攔截或線上系統互動，不影響對局行為。</p>
                    <p>分析結果可能受限於資料完整性、遊戲版本變動或解析技術限制，開發者不保證其即時性、準確性或完整性。</p>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="purpose">三、研究用途限制</h2>
                    <p>本服務僅供學習、研究與成果展示用途，不構成任何外掛、解包、破解，也不構成即時遊戲干擾或其他違規行為。</p>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="interpretation">四、最終解釋權</h2>
                    <p>在法律允許範圍內，本服務及相關政策文件之最終解釋權歸開發者所有。</p>
                </section>
            </article>
        </div>
    );
}
import styles from '../docs.module.css';

export default function Privacy() {
    return (
        <div className={styles.container}>
            <article className={styles.content}>
                <header className={styles.header}>
                    <h1>隱私權政策</h1>
                    <p className={styles.subtitle}>Privacy Policy</p>
                    <p className={styles.intro}>本文件為本服務之附屬文件（隱私權政策 Privacy Policy）。本政策說明本服務於使用過程中之資料蒐集、處理與利用方式。</p>
                </header>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="scope">一、資料蒐集範圍</h2>

                    <div className={styles.subsection}>
                        <h3>1. 帳戶資訊</h3>
                        <ul className={styles.list}>
                            <li>註冊電子郵件</li>
                            <li>使用者自訂名稱</li>
                            <li>遊戲內玩家 ID</li>
                        </ul>
                    </div>

                    <div className={styles.subsection}>
                        <h3>2. 對局與分析資料</h3>
                        <ul className={styles.list}>
                            <li>地圖名稱、角色選擇</li>
                            <li>對局時間、勝負結果、得分</li>
                            <li>系統分析產生之統計資料</li>
                        </ul>
                    </div>

                    <div className={styles.subsection}>
                        <h3>3. 行為軌跡數據</h3>
                        <ul className={styles.list}>
                            <li>對局錄像中之玩家位移與操作時間點</li>
                        </ul>
                    </div>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="security">二、帳號與密碼安全</h2>
                    <ul className={styles.list}>
                        <li>密碼 <strong>絕不儲存明文</strong>，傳輸後即進行雜湊（Hashing）</li>
                        <li>使用 HTTPS / TLS 加密傳輸</li>
                    </ul>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="identification">三、不進行去識別化</h2>
                    <p>本服務<strong>不會</strong>對使用者名稱或玩家 ID 去識別化。開發者及授權展示對象可直接查閱原始對局資料與身份關聯。</p>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="authorization">四、研究分析與成果展示授權</h2>

                    <div className={styles.subsection}>
                        <h3>1. 研究分析權</h3>
                        <p>使用者同意開發者利用所有上傳或解析資料進行演算法開發、系統除錯、模型訓練及個人研究分析。</p>
                    </div>

                    <div className={styles.subsection}>
                        <h3>2. 成果展示權</h3>
                        <p>使用者授權開發者，可將包含身份資訊（名稱 / ID）之分析圖表、系統截圖或操作影片，用於：</p>
                        <ul className={styles.list}>
                            <li>大學入學面試</li>
                            <li>特殊選才招生</li>
                            <li>校內自主學習成果發表</li>
                            <li>技術論壇展示</li>
                        </ul>
                        <p>無需另行通知。</p>
                    </div>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="retention">五、資料保留與刪除請求</h2>
                    <ul className={styles.list}>
                        <li>原始位移與行為資料保留 30–60 天</li>
                        <li>過期後僅保留精簡對局結果</li>
                        <li>使用者可請求停止使用或刪除帳戶資料</li>
                        <li>已用於研究分析或展示之資料不溯及刪除</li>
                    </ul>
                </section>
            </article>
        </div>
    );
}
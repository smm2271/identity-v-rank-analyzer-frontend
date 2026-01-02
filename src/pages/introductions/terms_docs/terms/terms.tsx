import styles from '../docs.module.css';
export default function Terms() {
    return (
        <div className={styles.container}>
            <article className={styles.content}>
                <header className={styles.header}>
                    <h1>服務條款</h1>
                    <p className={styles.subtitle}>Terms of Service</p>
                    <p className={styles.intro}>本文件為本服務之最上位規範文件（Terms of Service）。</p>
                </header>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="nature">一、專案性質與聲明</h2>
                    <p>本專案 <strong>{'{TBD: 專案名稱}'}</strong>（以下簡稱「本服務」）由開發者 Zalic.Su 基於個人自主學習與研究目的所開發之非商業性工具。</p>

                    <div className={styles.subsection}>
                        <h3>1. 版權聲明</h3>
                        <p>本服務涉及之遊戲《第五人格》（Identity V）之角色、美術及相關智慧財産權，均屬原著作權人 <strong>網易（NetEase）</strong> 所有。本服務非官方授權，亦不代表官方立場。</p>
                    </div>

                    <div className={styles.subsection}>
                        <h3>2. 非違規程式聲明</h3>
                        <p>本服務僅透過 CLI 工具解析使用者本機端遊戲資料目錄中所產生的對局錄像，<strong>以離線方式分析，不修改遊戲程式、不干擾封包，也不影響對局行為</strong>，<strong>不屬外掛或作弊程式</strong>。</p>
                    </div>

                    <div className={styles.subsection}>
                        <h3>3. 研究性質與風險告知</h3>
                        <p>本服務為自主學習與研究用途的實驗性工具，開發者不保證服務穩定性或長期可用性，使用者需自行承擔使用風險。</p>
                    </div>

                    <div className={styles.subsection}>
                        <h3>4. 未成年人使用聲明</h3>
                        <p>若使用者未滿法定完全行為能力，須經法定代理人知情同意。未經同意使用所產生的法律責任，由使用者及其法定代理人承擔。</p>
                    </div>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="files">二、文件關係與優先順序</h2>
                    <p>本服務條款為最上位規範文件。使用者於使用本服務時，即視為同意並受下列文件之拘束：</p>
                    <ul className={styles.list}>
                        <li>《隱私權政策（Privacy Policy）》</li>
                        <li>《法律免責聲明（Legal Disclaimer）》</li>
                    </ul>
                    <p>如前述文件內容與本條款衝突，<strong>以本條款為準</strong>。</p>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="rules">三、服務使用規範</h2>
                    <p>使用者不得：</p>
                    <ul className={styles.list}>
                        <li>上傳非法或侵權內容</li>
                        <li>嘗試對後端系統進行未授權存取、暴力破解或逆向工程</li>
                        <li>蓄意阻斷或過載服務</li>
                        <li>違反法律或公共秩序之行為</li>
                    </ul>
                    <p>開發者可依合理判斷限制、暫停或終止違規使用者之服務。</p>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="termination">四、服務變更與終止</h2>
                    <p>開發者可隨研究進度、技術調整或學期結束調整功能、暫停或終止服務。本服務不保證長期存取或永久資料保存。</p>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="liability">五、責任限制與法律適用</h2>
                    <p>開發者不對使用或無法使用本服務所產生之任何損害負責（法律允許範圍內）。</p>
                    <p>條款部分無效不影響其他條款效力。</p>
                    <p>條款解釋與適用依 <strong>中華民國（臺灣）法律</strong>。</p>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2 id="changes">六、條款修改</h2>
                    <p>本條款可隨研究與技術需求修訂，使用者於修訂後繼續使用本服務，即視為同意更新條款。</p>
                </section>
            </article>
        </div>
    );
}
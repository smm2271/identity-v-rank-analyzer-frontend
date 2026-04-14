import PublicNav from "../../../share/public-nav/public-nav";
import styles from "./about.module.css";

export default function About() {
    return (
        <>
            <PublicNav />
            <div className={styles.container}>
                <h1 className={styles.title}>第五人格分析小工具</h1>

                <div className={styles.about}>
                    <h2>專案動機</h2>
                    <p>身為一名喜愛《第五人格》的玩家，我希望藉由這次自主學習的機會，將對遊戲的熱忱轉化為技術成長的動力。
                        本專案核心目標在於學習 React 框架的組件化開發，並將其與我所熟悉的 FastAPI 後端框架進行整合，完成一次從零到一的全端開發實踐。
                        透過親手打造這款戰績紀錄工具，我鍛鍊資料庫設計與系統架構的思維，更能藉由數據分析直觀地審視對局表現，
                        從中找出適合自己的角色與版本優勢，達成技術成長與遊戲理解雙向提升的目標。
                    </p>
                    <h2>技術棧</h2>
                    <h3>前端</h3>
                    <ul>
                        <li>React</li>
                        <li>TypeScript</li>
                        <li>Zustand</li>
                    </ul>
                    <h3>後端</h3>
                    <ul>
                        <li>Python</li>
                        <li>FastAPI</li>
                    </ul>
                    <h3>資料庫</h3>
                    <ul>
                        <li>PostgreSQL</li>
                    </ul>
                    <h3>Client Tool (自動化數據採集工具) </h3>
                    <ul>
                        <li>Python</li>
                        <li>Watchdog</li>
                        <li>Pickle</li>
                    </ul>
                    <h3>部署</h3>
                    <ul>
                        <li>自家Server ヾ(≧▽≦*)o</li>
                        <li>Nginx Proxy Manager</li>
                        <li>Cloudflare</li>
                    </ul>
                    <h3>第三方登入(OAuth2)</h3>
                    <ul>
                        <li>Google</li>
                        <li>Discord</li>
                    </ul>
                </div>
                <div className={styles.about}>
                    <h2>關於開發者</h2>
                    <p>一名喜愛《第五人格》的高中生，喜歡以實踐的方式學習技術，目前熱衷於全端開發的實踐。</p>
                    <ul>
                        <li>GitHub：<a href="https://github.com/smm2271">smm2271</a></li>
                    </ul>

                    <h2>聯絡方式</h2>
                    <p>若對專案有任何問題或建議，歡迎透過以下方式聯繫本人：</p>
                    <ul>
                        <li>電子郵件：zalicsu@gmail.com</li>
                        <li>Discord：smm_2271</li>
                    </ul>
                </div>
            </div>
        </>
    );
}
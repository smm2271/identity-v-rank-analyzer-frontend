import { useSearchParams } from "react-router-dom";
import PublicNav from "../../../share/public-nav/public-nav";
import Terms from "./terms/terms";
import Privacy from "./privacy/privacy";
import Disclaimer from "./disclaimer/disclaimer";
import styles from "./docs.module.css";
import { NavLink } from "react-router-dom";

export default function Docs() {
    const [searchParams] = useSearchParams();
    const doc = searchParams.get("doc");
    return (
        <>
            <PublicNav />
            <div className={styles.outlayContainer}>
                <div className={styles.switch}>
                    <NavLink to="?doc=terms" className={doc === "terms" ? styles.activeLink : styles.link}>服務條款</NavLink>
                    {doc === "terms" && (
                        <div className={styles.subSwitch}>
                            <a href="#nature">專案性質</a>
                            <a href="#files">文件關係</a>
                            <a href="#rules">使用規範</a>
                            <a href="#termination">服務變更</a>
                            <a href="#liability">責任限制</a>
                            <a href="#changes">條款修改</a>
                        </div>
                    )}

                    <NavLink to="?doc=privacy" className={doc === "privacy" ? styles.activeLink : styles.link}>隱私政策</NavLink>
                    {doc === "privacy" && (
                        <div className={styles.subSwitch}>
                            <a href="#scope">蒐集範圍</a>
                            <a href="#security">帳號安全</a>
                            <a href="#identification">去識別化</a>
                            <a href="#authorization">成果授權</a>
                            <a href="#retention">資料刪除</a>
                        </div>
                    )}

                    <NavLink to="?doc=disclaimer" className={doc === "disclaimer" ? styles.activeLink : styles.link}>法律免責聲明</NavLink>
                    {doc === "disclaimer" && (
                        <div className={styles.subSwitch}>
                            <a href="#official">官方關係</a>
                            <a href="#source">資料來源</a>
                            <a href="#purpose">研究用途</a>
                            <a href="#interpretation">解釋權</a>
                        </div>
                    )}
                </div>
                <div className={styles.contentContainer}>
                    {doc === "terms" && <Terms />}
                    {doc === "privacy" && <Privacy />}
                    {doc === "disclaimer" && <Disclaimer />}
                </div>
            </div>
        </>
    );
}
import PublicNav from "../../../share/public-nav/public-nav";
import styles from "./features.module.css";

export default function Features() {
    return (
        <div>
            <PublicNav />
            <div className={styles.content}>
                <h1>功能介紹</h1>
                <h2>
                    建置中......
                </h2>
            </div>
        </div>
    );
}
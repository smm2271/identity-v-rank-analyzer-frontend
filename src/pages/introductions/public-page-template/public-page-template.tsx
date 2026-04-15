import PublicNav from "../../../share/public-nav/public-nav";
import styles from "./public-page-template.module.css";

export default function PublicPageTemplate() {
    return (
        <div className={styles.pageContainer}>
            <PublicNav />

            <main className={styles.mainContent}>
                <header className={styles.heroBlock}>
                    <p className={styles.badge}>Template</p>
                    <h1 className={styles.title}>公開頁面標題</h1>
                    <p className={styles.subtitle}>這是可重複使用的公開頁模板，已內建固定 Nav 的頂部避讓。</p>
                </header>

                <section className={styles.card}>
                    <h2>區塊標題</h2>
                    <p>在這裡放你的內容。若有更多段落、清單、圖片，會自然向下延展並維持一致間距。</p>
                </section>

                <section className={styles.card}>
                    <h2>第二區塊</h2>
                    <p>複製這個 section 即可快速擴充頁面內容。</p>
                </section>
            </main>
        </div>
    );
}

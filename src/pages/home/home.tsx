import styles from './home.module.css';
import PublicNav from '../../share/public-nav/public-nav';

export default function Home() {
  return (
    <div className={styles.home}>
      <PublicNav />
      <div className={styles.heroBanner}>
        <p className={styles.heroBannerLittleTitle}>● 學生自主學習計畫作品</p>
        <h1 className={styles.heroBannerTitle}>第五人格分析小工具</h1>
        <p className={styles.heroBannerContent}>從角色勝率到BP選擇</p>
        <p className={styles.heroBannerContent}>千場對局，逐步分析，讓你看見個人趨勢。</p>
      </div>
    </div>
  );
}

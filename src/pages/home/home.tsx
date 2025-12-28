import styles from './home.module.css';
import PublicNav from '../../share/public-nav/public-nav';

export default function Home() {
  return (
    <div className={styles.home}>
      <PublicNav />
      <h1>Home</h1>
    </div>
  );
}

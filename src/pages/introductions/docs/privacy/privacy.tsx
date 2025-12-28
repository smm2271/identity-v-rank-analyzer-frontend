import styles from './privacy.module.css';
import PublicNav from '../../../../share/public-nav/public-nav';

export default function Privacy() {
    return (
        <div className={styles.privacy}>
            <PublicNav />
            <h1>隱私政策</h1>
        </div>
    );
}
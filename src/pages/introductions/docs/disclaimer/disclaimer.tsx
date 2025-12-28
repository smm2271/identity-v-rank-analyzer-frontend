import styles from './disclaimer.module.css';
import PublicNav from '../../../../share/public-nav/public-nav';

export default function Disclaimer() {
    return (
        <div className={styles.disclaimer}>
            <PublicNav />
            <h1>免責聲明</h1>
        </div>
    );
}
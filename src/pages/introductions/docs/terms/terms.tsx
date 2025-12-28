import styles from './terms.module.css';
import PublicNav from '../../../../share/public-nav/public-nav';

export default function Terms() {
    return (
        <div className={styles.terms}>
            <PublicNav />
            <h1>使用條款</h1>
        </div>
    );
}
import { Link } from 'react-router-dom';
import styles from './signin-nav.module.css';

export default function SigninNav() {
  return (
    <div className={styles.publicNav}>
      <div>
        <Link to="/"><h1>第五人格分析小工具</h1></Link>
      </div>
      <div className={styles.loginSignInBtns}>
        <Link to='/help' className={styles.helpBtn}>幫助</Link>
      </div>
    </div>
  );
}
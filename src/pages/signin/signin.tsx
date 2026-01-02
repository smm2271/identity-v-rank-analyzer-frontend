import { useSearchParams, Link } from "react-router-dom";
import SigninNav from "../../share/signin-nav/signin-nav";
import styles from "./signin.module.css";
import Login from "./login/login";
import Register from "./register/register";

export default function Signin() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get("type");
    return (
        <div className={styles.signinPageContainer}>
            <SigninNav />
            <div className={styles.mainContainer}>
                <div className={styles.introductionContainer}>
                    <div>
                        <p className={styles.version}>v1.0.0 測試版</p>
                        <h1>
                            第五人格分析小工具
                        </h1>
                        <p>從角色勝率到BP選擇。</p>
                        <p>千場對局，逐步分析，讓你看見個人趨勢。</p>
                    </div>
                </div>
                <div className={styles.signinContainer}>
                    <div className={styles.signinFormContainer}>
                        <div className={styles.signinFormSwitchContainer}>
                            <Link to="?type=login" className={(type === "login") ? styles.active : ""}>登入</Link>
                            <Link to="?type=register" className={(type === "register") ? styles.active : ""}>註冊</Link>
                        </div>
                        <div className={styles.signinFormContentContainer}>
                            {type === "login" && <Login />}
                            {type === "register" && <Register />}
                        </div>
                        <div className={styles.orContainer}>
                            <p>或</p>
                        </div>
                        <div className={styles.oAuthButtonContainer}>
                            <button className={styles.oAuthButtonDiscord}><i className="fa-brands fa-discord"></i>Discord</button>
                            <button className={styles.oAuthButtonGoogle}><i className="fa-brands fa-google"></i>Google</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
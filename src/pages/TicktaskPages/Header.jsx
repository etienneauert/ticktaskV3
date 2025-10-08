import styles from "./Header.module.css";
import fire from "../../assets/flame.png";

export default function Header({ user, onLogout }) {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.streak}>
        <p className={styles.counter}>3</p>
        <img className={styles.fireIcon} src={fire} alt="" />
      </div>
      <div className={styles.buttonsRight}>
        <button className={styles.headerAboutButton}>About</button>
        <button className={styles.headerLogoutButton} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

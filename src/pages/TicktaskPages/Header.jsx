import styles from "./Header.module.css";
import fire from "../../assets/flame.png";
import setting from "../../assets/setting.png";
import info from "../../assets/info.png";

export default function Header({ onLogout }) {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.streak}>
        <p className={styles.counter}>3</p>
        <img className={styles.fireIcon} src={fire} alt="" />
      </div>
      <div className={styles.buttonsRight}>
        <button className={styles.headerSettingsButton}>
          <img src={setting} alt="" />
        </button>
        <button className={styles.headerAboutButton}>
          <img src={info} alt="" />
        </button>
        <button className={styles.headerLogoutButton} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

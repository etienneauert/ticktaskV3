import styles from "./Header.module.css";
import fire from "../../assets/flame.png";
import setting from "../../assets/setting.png";
import info from "../../assets/info.png";
import SettingsPopup from "./Settings/SettingsPopup";
import InfoPopup from "./Info/InfoPopup";
import { useState } from "react";

export default function Header({
  onLogout,
  weeklyTasks,
  updateWeeklyTasks,
  morningTasks,
  updateMorningTasks,
  abendTasks,
  updateAbendTasks,
  dailyTasks,
  updateDailyTasks,
  user,
  streak,
  onResetStreak,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  return (
    <div className={styles.headerContainer}>
      <div className={styles.streak}>
        <p className={styles.counter}>{streak}</p>
        <img className={styles.fireIcon} src={fire} alt="" />
      </div>
      <div className={styles.buttonsRight}>
        <button
          className={styles.headerSettingsButton}
          onClick={() => setSettingsOpen(true)}
        >
          <img src={setting} alt="" />
        </button>
        <button
          className={styles.headerAboutButton}
          onClick={() => setInfoOpen(true)}
        >
          <img src={info} alt="" />
        </button>
        <button className={styles.headerLogoutButton} onClick={onLogout}>
          Logout
        </button>
      </div>

      <SettingsPopup
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        weeklyTasks={weeklyTasks}
        updateWeeklyTasks={updateWeeklyTasks}
        morningTasks={morningTasks}
        updateMorningTasks={updateMorningTasks}
        abendTasks={abendTasks}
        updateAbendTasks={updateAbendTasks}
        dailyTasks={dailyTasks}
        updateDailyTasks={updateDailyTasks}
        user={user}
        streak={streak}
        onResetStreak={onResetStreak}
      />

      <InfoPopup open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}

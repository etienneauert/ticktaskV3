import styles from "./SettingsPopup.module.css";

export default function GeneralTab({ streak, onResetStreak }) {
  const handleResetStreak = () => {
    if (window.confirm("Möchtest du den Streak wirklich auf 0 zurücksetzen?")) {
      onResetStreak();
    }
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.generalSection}>
        <div className={styles.streakRow}>
          <span className={styles.currentStreak}>
            Streak: <span className={styles.streakNumber}>{streak}</span>
          </span>
          <button className={styles.resetButton} onClick={handleResetStreak}>
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}

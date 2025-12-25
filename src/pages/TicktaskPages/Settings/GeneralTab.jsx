import styles from "./SettingsPopup.module.css";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function GeneralTab({ streak, onResetStreak, user, onResetApp, onOpenWelcome, onClose }) {
  const { language, changeLanguage, t } = useLanguage();

  const handleResetStreak = () => {
    if (window.confirm(t("confirmResetStreak"))) {
      onResetStreak();
    }
  };

  const handleResetApp = () => {
    if (window.confirm(t("confirmResetApp"))) {
      onResetApp();
    }
  };

  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage);
    
    // We DON'T want to reopen settings after reload anymore
    // localStorage.setItem("ticktask_reopenSettings", "true");
    
    // Just reload the page
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleStartTutorial = () => {
    if (onOpenWelcome) {
      onOpenWelcome();
      onClose(); // Close settings popup
    }
  };


  return (
    <div className={styles.tabPanel}>
      <div className={styles.generalSection}>
        <div className={styles.streakRow}>
          <span className={styles.currentStreak}>
            {t("streak")}: <span className={styles.streakNumber}>{streak}</span>
          </span>
          <button className={styles.resetButton} onClick={handleResetStreak}>
            {t("reset")}
          </button>
        </div>

        <div className={styles.streakRow}>
          <span className={styles.currentStreak}>{t("resetApp")}:</span>
          <button className={styles.resetButton} onClick={handleResetApp}>
            {t("reset")}
          </button>
        </div>

        <div className={`${styles.streakRow} ${styles.tutorialRow}`}>
          <span className={styles.currentStreak}>{t("tutorial")}:</span>
          <button className={styles.tutorialButton} onClick={handleStartTutorial}>
            {t("start")}
          </button>
        </div>

        <div className={styles.languageRow}>
          <span className={styles.languageLabel}>{t("language")}:</span>
          <div className={styles.languageButtons}>
            <button
              className={`${styles.languageButton} ${
                language === "de" ? styles.languageButtonActive : ""
              }`}
              onClick={() => handleLanguageChange("de")}
            >
              {t("german")}
            </button>
            <button
              className={`${styles.languageButton} ${
                language === "en" ? styles.languageButtonActive : ""
              }`}
              onClick={() => handleLanguageChange("en")}
            >
              {t("english")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

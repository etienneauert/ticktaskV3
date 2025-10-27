import styles from "./SettingsPopup.module.css";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function GeneralTab({ streak, onResetStreak }) {
  const { language, changeLanguage, t } = useLanguage();

  const handleResetStreak = () => {
    if (window.confirm(t("confirmResetStreak"))) {
      onResetStreak();
    }
  };

  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage);
    // Speichere dass SettingsPopup nach Reload geöffnet werden soll mit General Tab
    localStorage.setItem("ticktask_reopenSettings", "true");
    localStorage.setItem("ticktask_settingsTab", "1"); // General Tab ID
    // Seite neu laden nach Sprachwechsel
    setTimeout(() => {
      window.location.reload();
    }, 100);
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

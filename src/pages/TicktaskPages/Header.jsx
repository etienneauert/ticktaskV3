import styles from "./Header.module.css";
import fire from "../../assets/flame.png";
import setting from "../../assets/setting.png";
import info from "../../assets/info.png";
import SettingsPopup from "./Settings/SettingsPopup";
import InfoPopup from "./Info/InfoPopup";
import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

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
  tasks,
  morningCompleted,
  setMorningCompleted,
  abendCompleted,
  setAbendCompleted,
  dailyCompleted,
  setDailyCompleted,
  weeklyCompleted,
  setWeeklyCompleted,
  increaseStreak,
  isGuestMode = false,
  showErrorMessage,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const { t } = useLanguage();

  // Finish Day Button Logik
  const handleFinishDay = () => {
    // Prüfe ob Finish Day möglich ist
    if (isFinishDayDisabled()) {
      // Erstelle detaillierte Fehlermeldung
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
      });
      const todayLower = today.toLowerCase();
      const todayTasks =
        weeklyTasks[today] ||
        weeklyTasks[todayLower] ||
        weeklyTasks[today.toUpperCase()] ||
        [];

      const activeTasks = tasks.filter((task) => !task.done);
      const morningOk =
        morningTasks.length === 0 ||
        morningCompleted.size === morningTasks.length;
      const abendOk =
        abendTasks.length === 0 || abendCompleted.size === abendTasks.length;
      const dailyOk =
        dailyTasks.length === 0 || dailyCompleted.size === dailyTasks.length;
      const allTodayTasksCompleted =
        todayTasks.length === 0 ||
        todayTasks.every((task) => weeklyCompleted.has(task));

      const missingItems = [];

      if (activeTasks.length > 0) {
        missingItems.push(
          `${activeTasks.length} aktive Task${
            activeTasks.length > 1 ? "s" : ""
          }`
        );
      }
      if (!morningOk) {
        const completed = morningCompleted.size;
        const total = morningTasks.length;
        const missing = total - completed;
        missingItems.push(`Morgenroutine: ${missing}/${total}`);
      }
      if (!abendOk) {
        const completed = abendCompleted.size;
        const total = abendTasks.length;
        const missing = total - completed;
        missingItems.push(`Abendroutine: ${missing}/${total}`);
      }
      if (!dailyOk) {
        const completed = dailyCompleted.size;
        const total = dailyTasks.length;
        const missing = total - completed;
        missingItems.push(`Tägliche: ${missing}/${total}`);
      }
      if (!allTodayTasksCompleted) {
        const completed = todayTasks.filter((task) =>
          weeklyCompleted.has(task)
        ).length;
        const total = todayTasks.length;
        const missing = total - completed;
        missingItems.push(`Wöchentliche: ${missing}/${total}`);
      }

      const errorMessage = `Tag noch nicht fertig!\n\n${missingItems.join(
        "\n\n"
      )}`;

      showErrorMessage(errorMessage);
      return;
    }

    // Streak erhöhen
    increaseStreak();

    // Alle Checklisten zurücksetzen
    setMorningCompleted(new Set());
    setAbendCompleted(new Set());
    setDailyCompleted(new Set());
    setWeeklyCompleted(new Set());
  };

  const isFinishDayDisabled = () => {
    // Direkte Berechnung für Weekly
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });
    const todayLower = today.toLowerCase();
    const todayTasks =
      weeklyTasks[today] ||
      weeklyTasks[todayLower] ||
      weeklyTasks[today.toUpperCase()] ||
      [];

    // Prüfe ob überhaupt Tasks vorhanden sind
    const hasAnyTasks =
      tasks.length > 0 ||
      morningTasks.length > 0 ||
      abendTasks.length > 0 ||
      dailyTasks.length > 0 ||
      todayTasks.length > 0;

    // Wenn keine Tasks vorhanden sind, Button deaktivieren
    if (!hasAnyTasks) {
      return true;
    }

    const allTodayTasksCompleted =
      todayTasks.length === 0 ||
      todayTasks.every((task) => weeklyCompleted.has(task));
    const weeklyOk = allTodayTasksCompleted;

    // Prüfe alle anderen Bedingungen
    const activeTasks = tasks.filter((task) => !task.done);
    const morningOk =
      morningTasks.length === 0 ||
      morningCompleted.size === morningTasks.length;
    const abendOk =
      abendTasks.length === 0 || abendCompleted.size === abendTasks.length;
    const dailyOk =
      dailyTasks.length === 0 || dailyCompleted.size === dailyTasks.length;

    return (
      activeTasks.length > 0 || !morningOk || !abendOk || !dailyOk || !weeklyOk
    );
  };

  // Prüfe ob SettingsPopup nach Reload geöffnet werden soll
  useEffect(() => {
    const shouldReopenSettings = localStorage.getItem(
      "ticktask_reopenSettings"
    );
    if (shouldReopenSettings === "true") {
      setSettingsOpen(true);
      localStorage.removeItem("ticktask_reopenSettings");
    }
  }, []);

  return (
    <div
      className={`${styles.headerContainer} ${
        isGuestMode ? styles.guestMode : ""
      }`}
    >
      <div className={styles.headerLeft}>
        <div className={styles.streak}>
          <p className={styles.counter}>{streak}</p>
          <img className={styles.fireIcon} src={fire} alt="" />
        </div>
        <button
          className={`${styles.finishDayButton} ${
            isFinishDayDisabled() ? styles.disabled : ""
          }`}
          onClick={handleFinishDay}
        >
          {t("finishDay")}
        </button>
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
          {t("logout")}
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

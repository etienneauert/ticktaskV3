import styles from "./Header.module.css";
import fire from "../../assets/flame.png";
import setting from "../../assets/setting.png";
import info from "../../assets/info.png";
import SettingsPopup from "./Settings/SettingsPopup";
import InfoPopup from "./Info/InfoPopup";
import ErrorMessage from "./ErrorMessage";
import { useState, useEffect, useRef } from "react";
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const finishDayButtonRef = useRef(null);
  const { t } = useLanguage();

  // Aktualisiere die aktuelle Uhrzeit jede Minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    // Sofort aktualisieren
    updateTime();

    // Dann jede Minute aktualisieren
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

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
        missingItems.push(`Morgenroutine: ${completed}/${total}`);
      }
      if (!abendOk) {
        const completed = abendCompleted.size;
        const total = abendTasks.length;
        missingItems.push(`Abendroutine: ${completed}/${total}`);
      }
      if (!dailyOk) {
        const completed = dailyCompleted.size;
        const total = dailyTasks.length;
        missingItems.push(`Tägliche: ${completed}/${total}`);
      }
      if (!allTodayTasksCompleted) {
        const completed = todayTasks.filter((task) =>
          weeklyCompleted.has(task)
        ).length;
        const total = todayTasks.length;
        missingItems.push(`Wöchentliche: ${completed}/${total}`);
      }

      const errorMessage = `Tag noch nicht fertig!\n\n${missingItems.join(
        "\n\n"
      )}`;

      setErrorMessage(errorMessage);
      setShowError(true);
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

  // Höre auf Events zum Öffnen der Settings mit einem bestimmten Tab
  useEffect(() => {
    const handleOpenSettings = (event) => {
      const { tabId } = event.detail;
      localStorage.setItem("ticktask_settingsTab", String(tabId));
      setSettingsOpen(true);
    };

    window.addEventListener("openSettingsWithTab", handleOpenSettings);

    return () => {
      window.removeEventListener("openSettingsWithTab", handleOpenSettings);
    };
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
        <div className={styles.finishDayContainer}>
          <button
            ref={finishDayButtonRef}
            className={`${styles.finishDayButton} ${
              isFinishDayDisabled() ? styles.disabled : ""
            }`}
            onClick={handleFinishDay}
          >
            {t("finishDay")}
          </button>
          {showError && (
            <ErrorMessage
              message={errorMessage}
              isVisible={showError}
              onClose={() => setShowError(false)}
              buttonRef={finishDayButtonRef}
            />
          )}
        </div>
        <div className={styles.currentTimeHeader}>
          <span className={styles.currentDate}>
            {currentTime.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
          <span className={styles.timeSeparator}>|</span>
          <span className={styles.currentTime}>
            {String(currentTime.getHours()).padStart(2, "0")}:
            {String(currentTime.getMinutes()).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className={styles.buttonsRight}>
        <nav className={styles.headerNav}>
          <button
            className={styles.navLink}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Tasks
          </button>
          <button
            className={styles.navLink}
            onClick={() => {
              const element = document.getElementById("calendar-section");
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            Kalender
          </button>
          <button
            className={styles.navLink}
            onClick={() => {
              const element = document.getElementById("goals-section");
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            Ziele
          </button>
        </nav>
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

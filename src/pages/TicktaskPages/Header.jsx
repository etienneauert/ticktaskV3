import styles from "./Header.module.css";
import fire from "../../assets/flame.png";
import setting from "../../assets/setting.png";
import info from "../../assets/info.png";
import audioIconYellow from "../../assets/speaker-filled-audio-tool gelb.png";
import soundwaveVideo from "../../assets/audios/sound-wave.mov";
import lofiMusic from "../../assets/audios/lofi-music.mp3";

import SettingsPopup from "./Settings/SettingsPopup";
import RoutineCustomizationPopup from "./Settings/RoutineCustomizationPopup";
import InfoPopup from "./Info/InfoPopup";
import ErrorMessage from "./ErrorMessage";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { unlockAudio, playTimerEndSound, getAudioEnabled, setAudioEnabled } from "../../utils/audio";

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
  updateGuestData,
  guestData,
  onResetApp,
  onOpenWelcome,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [routineCustomizationOpen, setRoutineCustomizationOpen] =
    useState(false);
  const [routineCustomizationTab, setRoutineCustomizationTab] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [audioActive, setAudioActive] = useState(getAudioEnabled());
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(new Audio(lofiMusic));
  const finishDayButtonRef = useRef(null);
  const { t, language } = useLanguage();

  // Configure audio
  useEffect(() => {
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    
    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        audioRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play().catch(e => console.error("Video play failed:", e));
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        setIsVideoPlaying(true);
      }
    }
  };


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
    // Prüfe zuerst, ob der Tag bereits heute beendet wurde (pro Benutzer)
    const today = new Date().toDateString(); // Format: "Mon Jan 01 2024"
    const userKey = user?.uid
      ? `ticktask_lastFinishDay_${user.uid}`
      : "ticktask_lastFinishDay_guest";
    const lastFinishDay = localStorage.getItem(userKey);

    if (lastFinishDay === today) {
      // Tag wurde bereits heute beendet
      setErrorMessage("Du hast den Tag heute schon beendet!");
      setShowError(true);
      return;
    }

    // Prüfe ob überhaupt Tasks vorhanden sind
    const todayWeekday = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });
    const todayLower = todayWeekday.toLowerCase();
    const todayTasks =
      weeklyTasks[todayWeekday] ||
      weeklyTasks[todayLower] ||
      weeklyTasks[todayWeekday.toUpperCase()] ||
      [];

    const hasAnyTasks =
      tasks.length > 0 ||
      morningTasks.length > 0 ||
      abendTasks.length > 0 ||
      dailyTasks.length > 0 ||
      todayTasks.length > 0;

    if (!hasAnyTasks) {
      // Keine Tasks vorhanden
      setErrorMessage("Erstelle mindestens einen Task, um den Tag zu beenden");
      setShowError(true);
      return;
    }

    // Prüfe ob Finish Day möglich ist
    if (isFinishDayDisabled()) {
      // Erstelle detaillierte Fehlermeldung
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

    // Speichere das heutige Datum als letztes Finish Day (pro Benutzer)
    localStorage.setItem(userKey, today);

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

  // Höre auf Events zum Öffnen des Routine-Customization-Popups
  useEffect(() => {
    const handleOpenRoutineCustomization = (event) => {
      const { tabId } = event.detail;
      setRoutineCustomizationTab(tabId || 0);
      setRoutineCustomizationOpen(true);
    };

    window.addEventListener(
      "openRoutineCustomization",
      handleOpenRoutineCustomization
    );

    return () => {
      window.removeEventListener(
        "openRoutineCustomization",
        handleOpenRoutineCustomization
      );
    };
  }, []);

  return (
    <div
      className={`${styles.headerContainer} ${
        isGuestMode ? styles.guestMode : ""
      }`}
    >
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <div className={styles.streak}>
            <p className={styles.counter}>{streak}</p>
            <img className={styles.fireIcon} src={fire} alt="" />
          </div>
          <div className={styles.finishDayContainer}>
            <button
              id="finish-day-button"
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
              {currentTime.toLocaleDateString(
                language === "de" ? "de-DE" : "en-US",
                {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                }
              )}
            </span>
            <span className={styles.timeSeparator}>|</span>
            <span className={styles.currentTime}>
              {String(currentTime.getHours()).padStart(2, "0")}:
              {String(currentTime.getMinutes()).padStart(2, "0")}
            </span>
          </div>
          {isGuestMode && (
            <div className={styles.guestModeLabel}>{t("demoMode")}</div>
          )}
        </div>
        <div className={styles.buttonsRight}>
          <nav className={styles.headerNav}>
            <button
              className={styles.navLink}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {t("navTasks")}
            </button>
            <button
              className={styles.navLink}
              onClick={() => {
                const element = document.getElementById("calendar-section");
                if (element) {
                  const headerHeight = 70; // Geschätzte Header-Höhe
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
            >
              {t("navCalendar")}
            </button>
            <button
              className={styles.navLink}
              onClick={() => {
                const element = document.getElementById("goals-section");
                if (element) {
                  const headerHeight = 80; // Etwas mehr Offset für Goals
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition =
                    elementPosition + window.pageYOffset - headerHeight;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
            >
              {t("navGoals")}
            </button>
          </nav>
          

          {/* Soundwave Animation - Visual Only */}
          <div 
            className={styles.soundwaveContainer} 
            title={isVideoPlaying ? "Stop Flow Video" : "Start Flow Video"}
            onClick={toggleVideo} // Enable click to toggle
            style={{ 
              cursor: "pointer", 
              opacity: isVideoPlaying ? 1 : 0.3 
            }}
          >
            <video 
              ref={videoRef}
              src={soundwaveVideo} 
              className={styles.soundwaveVideo}
              // Removed autoPlay to let user control start, or add it back if it should start automatically 
              // but purely visual usually implies user choice if it has a toggle. 
              // Let's default to paused as per usual 'toggle' behavior or autoPlay?
              // User said "pausier funktion", implying it might be playing. 
              // Let's NOT autoPlay by default so it matches false state, or initialize state to true?
              // "nur das lied soll nicht mehr abgespielt werden" -> sound wave displayed.
              // Let's default to paused (opacity 0.3) so user can turn it on? 
              // Or default to on? "sound wave soll noch angezeigt werden" 
              // I'll default to paused to be safe with state=false.
              loop 
              muted 
              playsInline
            />
          </div>

          <button
            className={styles.headerAudioButton}
            onClick={() => {
              const newState = !audioActive;
              setAudioActive(newState);
              setAudioEnabled(newState);
              
              if (newState) {
                unlockAudio();
                playTimerEndSound();
              }
            }}
            title="Test Audio / Unlock Sound"
            style={{ opacity: audioActive ? 1 : 0.3 }}
          >
            <img src={audioIconYellow} alt="Audio" />
          </button>
          <button
            className={styles.headerSettingsButton}
            onClick={() => {
              localStorage.setItem("ticktask_settingsTab", "1"); // General Tab
              setSettingsOpen(true);
            }}
          >
            <img src={setting} alt="" />
          </button>
          <button
            id="info-button"
            className={styles.headerAboutButton}
            onClick={() => setInfoOpen(true)}
          >
            <img src={info} alt="" />
          </button>
          <button className={styles.headerLogoutButton} onClick={onLogout}>
            {isGuestMode ? t("exitDemo") : t("logout")}
          </button>
        </div>
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
        tasks={tasks}
        isGuestMode={isGuestMode}
        updateGuestData={updateGuestData}
        guestData={guestData}
        onResetApp={onResetApp}
        onOpenWelcome={onOpenWelcome}
      />

      <RoutineCustomizationPopup
        open={routineCustomizationOpen}
        onClose={() => setRoutineCustomizationOpen(false)}
        weeklyTasks={weeklyTasks}
        updateWeeklyTasks={updateWeeklyTasks}
        morningTasks={morningTasks}
        updateMorningTasks={updateMorningTasks}
        abendTasks={abendTasks}
        updateAbendTasks={updateAbendTasks}
        dailyTasks={dailyTasks}
        updateDailyTasks={updateDailyTasks}
        user={user}
        initialTab={routineCustomizationTab}
      />

      <InfoPopup open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}

import styles from "./SettingsPopup.module.css";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useState, useEffect } from "react";
import { db } from "../../../firebase/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function GeneralTab({ streak, onResetStreak, user }) {
  const { language, changeLanguage, t } = useLanguage();
  const [startHour, setStartHour] = useState(5); // Default: 05:00
  const [endHour, setEndHour] = useState(23); // Default: 23:00
  const [isHidden, setIsHidden] = useState(false);

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

  // Calendar Settings
  useEffect(() => {
    if (!user?.uid) return;
    loadCalendarSettings();
  }, [user?.uid]);

  const loadCalendarSettings = async () => {
    if (!user?.uid) return;

    try {
      // Versuche zuerst localStorage
      const localSettings = localStorage.getItem(
        `ticktask_calendar_hours_${user.uid}`
      );
      const localHidden = localStorage.getItem(
        `ticktask_calendar_hidden_${user.uid}`
      );
      if (localSettings) {
        const [start, end] = localSettings.split("-").map(Number);
        setStartHour(start);
        setEndHour(end);
      }
      if (localHidden === "true") {
        setIsHidden(true);
      }

      // Dann Firebase
      const settingsDoc = doc(db, "users", user.uid, "settings", "calendar");
      const settingsSnap = await getDoc(settingsDoc);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        const hours = data.hours || "5-23";
        const [start, end] = hours.split("-").map(Number);
        setStartHour(start);
        setEndHour(end);
        localStorage.setItem(`ticktask_calendar_hours_${user.uid}`, hours);

        if (data.hidden !== undefined) {
          setIsHidden(data.hidden);
          localStorage.setItem(
            `ticktask_calendar_hidden_${user.uid}`,
            String(data.hidden)
          );
        }
      }
    } catch (e) {
      console.error("Failed to load calendar settings", e);
    }
  };

  const saveCalendarSettings = async (newStartHour, newEndHour, newHidden) => {
    if (!user?.uid) return;

    const start = newStartHour !== undefined ? newStartHour : startHour;
    const end = newEndHour !== undefined ? newEndHour : endHour;
    const hidden = newHidden !== undefined ? newHidden : isHidden;

    if (start >= end) {
      alert("Die Startzeit muss vor der Endzeit liegen!");
      return;
    }

    const hours = `${start}-${end}`;

    // Speichere in localStorage
    try {
      localStorage.setItem(`ticktask_calendar_hours_${user.uid}`, hours);
      localStorage.setItem(
        `ticktask_calendar_hidden_${user.uid}`,
        String(hidden)
      );
    } catch (e) {
      console.error("Failed to save calendar settings locally", e);
    }

    // Speichere in Firebase
    try {
      const settingsDoc = doc(db, "users", user.uid, "settings", "calendar");
      await setDoc(settingsDoc, {
        hours: hours,
        hidden: hidden,
        lastUpdated: serverTimestamp(),
      });
      console.log("Saved calendar settings to Firebase:", { hours, hidden });

      // Dispatch Event für automatische Aktualisierung
      window.dispatchEvent(
        new CustomEvent("calendarSettingsChanged", {
          detail: { hours, hidden },
        })
      );
    } catch (e) {
      console.error("Failed to save calendar settings to Firebase", e);
    }
  };

  const handleStartHourChange = (newStartHour) => {
    setStartHour(newStartHour);
    saveCalendarSettings(newStartHour, endHour);
  };

  const handleEndHourChange = (newEndHour) => {
    setEndHour(newEndHour);
    saveCalendarSettings(startHour, newEndHour);
  };

  const handleHiddenToggle = () => {
    const newHidden = !isHidden;
    setIsHidden(newHidden);
    saveCalendarSettings(undefined, undefined, newHidden);
  };

  const hours = Array.from({ length: 25 }, (_, i) => i); // 0-24 für 00:00 bis 24:00

  return (
    <div className={styles.tabPanel}>
      <div className={styles.generalSection}>
        <h3 className={styles.generalHeading}>Allgemein</h3>
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

        {/* Calendar Settings */}
        <h3 className={styles.generalHeading} style={{ marginTop: "30px" }}>
          Kalender
        </h3>
        <div className={styles.languageRow}>
          <span className={styles.languageLabel}>Startzeit:</span>
          <select
            value={startHour}
            onChange={(e) => handleStartHourChange(Number(e.target.value))}
            className={styles.timeSelect}
          >
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>

        <div className={styles.languageRow}>
          <span className={styles.languageLabel}>Endzeit:</span>
          <select
            value={endHour}
            onChange={(e) => handleEndHourChange(Number(e.target.value))}
            className={styles.timeSelect}
          >
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>

        <div className={styles.streakRow}>
          <span className={styles.languageLabel}>Sichtbarkeit:</span>
          <button
            className={styles.calendarToggleButton}
            onClick={handleHiddenToggle}
          >
            {isHidden ? "Einblenden" : "Ausblenden"}
          </button>
        </div>
      </div>
    </div>
  );
}

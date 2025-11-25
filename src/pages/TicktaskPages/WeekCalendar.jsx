import styles from "./WeekCalendar.module.css";
import { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function WeekCalendar({ user }) {
  const weekDays = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ];

  const [startHour, setStartHour] = useState(5); // Default: 05:00
  const [endHour, setEndHour] = useState(23); // Default: 23:00
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!user?.uid) {
      // Im Gast-Modus: Standard verwenden
      setStartHour(5);
      setEndHour(23);
      return;
    }
    loadCalendarSettings();

    // Höre auf Änderungen der Kalender-Einstellungen
    const handleSettingsChange = (event) => {
      const { hours } = event.detail;
      const [start, end] = hours.split("-").map(Number);
      setStartHour(start);
      setEndHour(end);
    };

    window.addEventListener("calendarSettingsChanged", handleSettingsChange);

    return () => {
      window.removeEventListener(
        "calendarSettingsChanged",
        handleSettingsChange
      );
    };
  }, [user?.uid]);

  // Aktualisiere die aktuelle Zeit jede Minute
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

  const loadCalendarSettings = async () => {
    if (!user?.uid) return;

    try {
      // Versuche zuerst localStorage
      const localSettings = localStorage.getItem(
        `ticktask_calendar_hours_${user.uid}`
      );
      if (localSettings) {
        const [start, end] = localSettings.split("-").map(Number);
        setStartHour(start);
        setEndHour(end);
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
      }
    } catch (e) {
      console.error("Failed to load calendar settings", e);
    }
  };

  // Berechne Stunden basierend auf Einstellung
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour
  );

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Prüfe ob ein Datum der aktuelle Tag ist
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Berechne die Position des gelben Balkens für die aktuelle Zeit
  const getCurrentTimePosition = () => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    const adjustedDay = currentDay === 0 ? 6 : currentDay - 1; // Montag = 0, Sonntag = 6

    // Prüfe ob die aktuelle Zeit im sichtbaren Bereich liegt
    if (currentHour < startHour || currentHour > endHour) {
      return null;
    }

    // Berechne die vertikale Position
    const hourIndex = currentHour - startHour;
    const minutesInHour = currentMinute / 60;
    const cellHeight = 50; // Höhe einer Stunde in px
    const barHeight = 1; // Höhe der HorizontalBar zwischen Zeilen
    // Jede vollständige Stunde: cellHeight + barHeight (außer der letzten)
    // Für die Position innerhalb der aktuellen Stunde: nur cellHeight
    const topPosition =
      hourIndex * (cellHeight + barHeight) + minutesInHour * cellHeight;

    // Prüfe ob der aktuelle Tag in der angezeigten Woche liegt
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(
      today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)
    );
    weekStart.setHours(0, 0, 0, 0);

    const currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (currentDate - weekStart) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 0 || daysDiff > 6) {
      return null; // Nicht in der aktuellen Woche
    }

    return {
      top: topPosition,
      dayIndex: daysDiff,
    };
  };

  const timePosition = getCurrentTimePosition();

  return (
    <div className={styles.WeekCalendar}>
      <div className={styles.CalendarHeader}>
        <div className={styles.LeftBar}></div>
        <div className={styles.TimeColumnHeader}></div>
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`${styles.DayHeader} ${
              isToday(weekDates[index]) ? styles.DayHeaderToday : ""
            }`}
          >
            <div className={styles.DayName}>{day}</div>
            <div className={styles.DayDate}>
              {weekDates[index].getDate()}.
              {String(weekDates[index].getMonth() + 1).padStart(2, "0")}
            </div>
          </div>
        ))}
        <div className={styles.RightBar}></div>
      </div>
      <div className={styles.CalendarBody}>
        {timePosition && (
          <div
            className={styles.CurrentTimeIndicator}
            style={{
              top: `${timePosition.top}px`,
              gridColumn: `3 / 10`, // Spannt über alle 7 Tag-Spalten (Spalten 3-9)
            }}
          />
        )}
        <div className={styles.LeftBarColumn}>
          {hours.map((hour, index) => (
            <div key={hour}>
              <div className={styles.LeftBarCell}></div>
              {index < hours.length - 1 && (
                <div className={styles.HorizontalBar}></div>
              )}
            </div>
          ))}
        </div>
        <div className={styles.TimeColumn}>
          {hours.map((hour, index) => {
            const isCurrentHour =
              timePosition && currentTime.getHours() === hour;
            const currentMinute = currentTime.getMinutes();
            return (
              <div key={hour} className={styles.TimeRow}>
                <div
                  className={`${styles.TimeSlot} ${
                    isCurrentHour ? styles.TimeSlotCurrent : ""
                  }`}
                >
                  {isCurrentHour
                    ? `${String(hour).padStart(2, "0")}:${String(
                        currentMinute
                      ).padStart(2, "0")}`
                    : `${String(hour).padStart(2, "0")}:00`}
                </div>
                {index < hours.length - 1 && (
                  <div className={styles.HorizontalBar}></div>
                )}
              </div>
            );
          })}
        </div>
        {weekDays.map((day) => (
          <div key={day} className={styles.DayColumn}>
            {hours.map((hour, index) => (
              <div key={`${day}-${hour}`} className={styles.CalendarRow}>
                <div className={styles.CalendarCell}></div>
                {index < hours.length - 1 && (
                  <div className={styles.HorizontalBar}></div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div className={styles.RightBarColumn}>
          {hours.map((hour, index) => (
            <div key={hour} className={styles.RightBarRow}>
              <div className={styles.RightBarCell}></div>
              {index < hours.length - 1 && (
                <div className={styles.HorizontalBar}></div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.BottomBar}>
        <div className={styles.BottomBarLeft}></div>
        <div className={styles.BottomBarTimeColumn}></div>
        {weekDays.map((day) => (
          <div key={day} className={styles.BottomBarCell}></div>
        ))}
        <div className={styles.BottomBarRight}></div>
      </div>
    </div>
  );
}

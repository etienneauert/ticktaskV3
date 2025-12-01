import MainTasks from "./MainTasks";
import MainRoutine from "./MainRoutine";
import Checklist from "./Checklist/Checklist";
import WeekCalendar from "./WeekCalendar";
import Goals from "./Goals";
import styles from "./Main.module.css";
import { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Main({
  tasks,
  frequentTemplates,
  onDelete,
  onTaskDone,
  onEdit,
  onFrequentDelete,
  onCopyTask,
  weeklyTasks,
  dailyTasks,
  morningTasks,
  abendTasks,
  user,
  morningCompleted,
  setMorningCompleted,
  abendCompleted,
  setAbendCompleted,
  weeklyCompleted,
  setWeeklyCompleted,
  dailyCompleted,
  setDailyCompleted,
  runningTaskId,
  onTaskStart,
  onTaskStop,
  onClearAllDone,
}) {
  const [isCalendarHidden, setIsCalendarHidden] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      // Im Gast-Modus: Standard verwenden
      setIsCalendarHidden(false);
      return;
    }
    loadCalendarVisibility();

    // Höre auf Änderungen der Kalender-Einstellungen
    const handleSettingsChange = (event) => {
      const { hidden } = event.detail;
      if (hidden !== undefined) {
        setIsCalendarHidden(hidden);
      }
    };

    window.addEventListener("calendarSettingsChanged", handleSettingsChange);

    return () => {
      window.removeEventListener(
        "calendarSettingsChanged",
        handleSettingsChange
      );
    };
  }, [user?.uid]);

  const loadCalendarVisibility = async () => {
    if (!user?.uid) return;

    try {
      // Versuche zuerst localStorage
      const localHidden = localStorage.getItem(
        `ticktask_calendar_hidden_${user.uid}`
      );
      if (localHidden === "true") {
        setIsCalendarHidden(true);
      }

      // Dann Firebase
      const settingsDoc = doc(db, "users", user.uid, "settings", "calendar");
      const settingsSnap = await getDoc(settingsDoc);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.hidden !== undefined) {
          setIsCalendarHidden(data.hidden);
          localStorage.setItem(
            `ticktask_calendar_hidden_${user.uid}`,
            String(data.hidden)
          );
        }
      }
    } catch (e) {
      console.error("Failed to load calendar visibility", e);
    }
  };

  return (
    <div className={styles.Main}>
      <div className={styles.MainContent}>
        <div className={styles.MainRoutine}>
          <MainRoutine
            morningTasks={morningTasks}
            abendTasks={abendTasks}
            user={user}
            morningCompleted={morningCompleted}
            setMorningCompleted={setMorningCompleted}
            abendCompleted={abendCompleted}
            setAbendCompleted={setAbendCompleted}
          ></MainRoutine>
        </div>
        <div className={styles.MainTasks}>
          <MainTasks
            tasks={tasks}
            frequentTemplates={frequentTemplates}
            onDelete={onDelete}
            onTaskDone={onTaskDone}
            onEdit={onEdit}
            onFrequentDelete={onFrequentDelete}
            onCopyTask={onCopyTask}
            runningTaskId={runningTaskId}
            onTaskStart={onTaskStart}
            onTaskStop={onTaskStop}
            onClearAllDone={onClearAllDone}
          ></MainTasks>
        </div>
        <div className={styles.MainWeekly}>
          <Checklist
            weeklyTasks={weeklyTasks}
            dailyTasks={dailyTasks}
            user={user}
            weeklyCompleted={weeklyCompleted}
            setWeeklyCompleted={setWeeklyCompleted}
            dailyCompleted={dailyCompleted}
            setDailyCompleted={setDailyCompleted}
          ></Checklist>
        </div>
      </div>
      {!isCalendarHidden && (
        <div className={styles.WeekCalendarContainer}>
          <WeekCalendar
            user={user}
            tasks={tasks}
            runningTaskId={runningTaskId}
          />
        </div>
      )}
      <div className={styles.GoalsContainer}>
        <Goals user={user} />
      </div>
    </div>
  );
}

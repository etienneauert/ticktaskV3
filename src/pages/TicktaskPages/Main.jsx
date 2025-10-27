import MainTasks from "./MainTasks";
import MainRoutine from "./MainRoutine";
import Checklist from "./Checklist/Checklist";
import CenteredButton from "./CenteredButton";
import styles from "./Main.module.css";
import { useState, useEffect, useMemo } from "react";

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
  increaseStreak,
  canIncreaseStreak,
  onClearAllDone,
}) {
  // Button-Validierung: State für Button-Status
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  // Button-Status in Echtzeit aktualisieren
  useEffect(() => {
    // Filtere nur die AKTIVEN Tasks (nicht abgeschlossene)
    const activeTasks = tasks.filter((task) => !task.done);

    // Prüfe Checklisten
    const morningTasksCount = morningTasks.length;
    const morningCompletedCount = morningCompleted.size;
    const morningOk =
      morningTasksCount === 0 || morningCompletedCount === morningTasksCount;

    const abendTasksCount = abendTasks.length;
    const abendCompletedCount = abendCompleted.size;
    const abendOk =
      abendTasksCount === 0 || abendCompletedCount === abendTasksCount;

    const dailyTasksCount = dailyTasks.length;
    const dailyCompletedCount = dailyCompleted.size;
    const dailyOk =
      dailyTasksCount === 0 || dailyCompletedCount === dailyTasksCount;

    // Weekly Tasks - komplett überarbeitet
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todayLower = today.toLowerCase();

    // Prüfe alle möglichen Schreibweisen
    const todayTasks =
      weeklyTasks[today] ||
      weeklyTasks[todayLower] ||
      weeklyTasks[today.toUpperCase()] ||
      [];

    console.log("🔍 WEEKLY DEBUG:");
    console.log("- Today:", today);
    console.log("- Today lower:", todayLower);
    console.log("- Today tasks:", todayTasks);
    console.log("- WeeklyTasks keys:", Object.keys(weeklyTasks));
    console.log("- WeeklyTasks thursday:", weeklyTasks.thursday);
    console.log("- WeeklyTasks Thursday:", weeklyTasks.Thursday);
    console.log("- Weekly completed:", Array.from(weeklyCompleted));

    // Prüfe ob alle Tasks von heute abgehakt sind
    const allTodayTasksCompleted =
      todayTasks.length === 0 ||
      todayTasks.every((task) => weeklyCompleted.has(task));
    const weeklyOk = allTodayTasksCompleted;

    console.log("🔍 DEBUG Button Check - UPDATED:");
    console.log("- Active tasks:", activeTasks.length);
    console.log("- WeeklyTasks changed:", weeklyTasks);
    console.log("- WeeklyTasks thursday:", weeklyTasks.thursday);
    console.log("- WeeklyTasks object keys:", Object.keys(weeklyTasks));
    console.log("- Today:", today);
    console.log("- Today tasks:", todayTasks);
    console.log("- All today tasks completed:", allTodayTasksCompleted);
    console.log("- Morning tasks:", morningTasks);
    console.log("- Morning completed:", Array.from(morningCompleted));
    console.log(
      "- Morning tasks completed:",
      morningTasks.filter((task) => morningCompleted.has(task))
    );
    console.log(
      "- Morning:",
      morningOk,
      `(${morningCompletedCount}/${morningTasksCount})`
    );
    console.log("- Abend tasks:", abendTasks);
    console.log("- Abend completed:", Array.from(abendCompleted));
    console.log(
      "- Abend tasks completed:",
      abendTasks.filter((task) => abendCompleted.has(task))
    );
    console.log(
      "- Abend:",
      abendOk,
      `(${abendCompletedCount}/${abendTasksCount})`
    );
    console.log("- Daily tasks:", dailyTasks);
    console.log("- Daily completed:", Array.from(dailyCompleted));
    console.log(
      "- Daily tasks completed:",
      dailyTasks.filter((task) => dailyCompleted.has(task))
    );
    console.log(
      "- Daily:",
      dailyOk,
      `(${dailyCompletedCount}/${dailyTasksCount})`
    );
    console.log("- Today:", today);
    console.log("- Today tasks:", todayTasks);
    console.log("- WeeklyTasks object:", weeklyTasks);
    console.log("- WeeklyTasks thursday:", weeklyTasks.thursday);
    console.log("- Weekly completed:", Array.from(weeklyCompleted));
    console.log("- All today tasks completed:", allTodayTasksCompleted);
    console.log("- Weekly OK:", weeklyOk);

    // Button ist deaktiviert wenn:
    // - Es aktive Tasks gibt ODER
    // - Eine der Checklisten nicht vollständig abgehakt ist
    const shouldDisable =
      activeTasks.length > 0 || !morningOk || !abendOk || !dailyOk || !weeklyOk;
    console.log("- Should disable:", shouldDisable);

    setIsButtonDisabled(shouldDisable);
  }, [
    tasks,
    morningTasks,
    morningCompleted,
    abendTasks,
    abendCompleted,
    dailyTasks,
    dailyCompleted,
    weeklyTasks,
    weeklyCompleted,
  ]);
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
      <div className={styles.MainCenteredButton}>
        <CenteredButton
          onClick={() => {
            // Streak erhöhen
            increaseStreak();

            // Alle Checklisten zurücksetzen
            setMorningCompleted(new Set());
            setAbendCompleted(new Set());
            setDailyCompleted(new Set());
            setWeeklyCompleted(new Set());
          }}
          disabled={(() => {
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

            const allTodayTasksCompleted =
              todayTasks.length === 0 ||
              todayTasks.every((task) => weeklyCompleted.has(task));
            const weeklyOk = allTodayTasksCompleted;

            console.log("🔍 BUTTON WEEKLY CHECK:");
            console.log("- Today:", today);
            console.log("- Today tasks:", todayTasks);
            console.log("- All today tasks completed:", allTodayTasksCompleted);
            console.log("- Weekly OK:", weeklyOk);

            // Prüfe alle anderen Bedingungen
            const activeTasks = tasks.filter((task) => !task.done);
            const morningOk =
              morningTasks.length === 0 ||
              morningCompleted.size === morningTasks.length;
            const abendOk =
              abendTasks.length === 0 ||
              abendCompleted.size === abendTasks.length;
            const dailyOk =
              dailyTasks.length === 0 ||
              dailyCompleted.size === dailyTasks.length;

            const shouldDisable =
              activeTasks.length > 0 ||
              !morningOk ||
              !abendOk ||
              !dailyOk ||
              !weeklyOk;
            console.log("- Should disable:", shouldDisable);

            return shouldDisable;
          })()}
        >
          Finish Day
        </CenteredButton>
      </div>
    </div>
  );
}

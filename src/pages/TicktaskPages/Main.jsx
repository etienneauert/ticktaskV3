import MainTasks from "./MainTasks";
import MainRoutine from "./MainRoutine";
import Checklist from "./Checklist/Checklist";
import WeekCalendar from "./WeekCalendar";
import styles from "./Main.module.css";

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
      <div className={styles.WeekCalendarContainer}>
        <WeekCalendar user={user} />
      </div>
    </div>
  );
}

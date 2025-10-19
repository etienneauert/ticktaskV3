import Weekly from "./Weekly";
import Daily from "./Daily";
import styles from "./Checklist.module.css";

export default function Checklist({
  weeklyTasks,
  dailyTasks,
  user,
  weeklyCompleted,
  setWeeklyCompleted,
  dailyCompleted,
  setDailyCompleted,
}) {
  return (
    <div className={styles.checklistWrapper}>
      <Weekly
        weeklyTasks={weeklyTasks}
        user={user}
        completedTasks={weeklyCompleted}
        setCompletedTasks={setWeeklyCompleted}
      />
      <div className={styles.spacing}></div>
      <Daily
        dailyTasks={dailyTasks}
        user={user}
        completedTasks={dailyCompleted}
        setCompletedTasks={setDailyCompleted}
      />
    </div>
  );
}

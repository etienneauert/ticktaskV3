import styles from "./Weekly.module.css";

export default function Weekly({
  weeklyTasks,
  user,
  completedTasks,
  setCompletedTasks,
}) {
  // Aktuellen Tag ermitteln
  const today = new Date();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = dayNames[today.getDay()];

  const todayTasks = weeklyTasks?.[currentDay] || [];

  const toggleTask = (taskText) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskText)) {
        next.delete(taskText);
      } else {
        next.add(taskText);
      }
      return next;
    });
  };

  return (
    <div className={styles.weeklyContainer}>
      <h4 className={styles.weeklyTitle}>
        {currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}
      </h4>

      <div className={styles.tasksList}>
        {todayTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No tasks for today</span>
          </div>
        ) : (
          todayTasks.map((task, index) => {
            const checked = completedTasks.has(task);
            return (
              <div key={`${task}-${index}`} className={styles.taskItem}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTask(task)}
                  className={styles.checkbox}
                />
                <span
                  className={`${styles.taskText} ${
                    checked ? styles.completed : ""
                  }`}
                >
                  {task}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

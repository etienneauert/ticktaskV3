import styles from "./Daily.module.css";

export default function Daily({
  dailyTasks,
  user,
  completedTasks,
  setCompletedTasks,
}) {
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
    <div className={styles.dailyContainer}>
      <h4 className={styles.dailyTitle}>Daily</h4>

      <div className={styles.tasksList}>
        {dailyTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No tasks for today</span>
          </div>
        ) : (
          dailyTasks.map((task, index) => {
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

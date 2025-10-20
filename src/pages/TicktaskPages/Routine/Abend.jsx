import styles from "./Abend.module.css";
import { useState } from "react";

export default function Abend({
  abendTasks,
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
    <div className={styles.abendContainer}>
      <h4 className={styles.abendTitle}>Evening</h4>

      <div className={styles.tasksList}>
        {abendTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No tasks for today</span>
          </div>
        ) : (
          abendTasks.map((task, index) => {
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

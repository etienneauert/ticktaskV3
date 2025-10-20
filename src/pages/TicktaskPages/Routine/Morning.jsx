import styles from "./Morning.module.css";
import { useState } from "react";

export default function Morning({
  morningTasks,
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
    <div className={styles.morningContainer}>
      <h4 className={styles.morningTitle}>Morning</h4>

      <div className={styles.tasksList}>
        {morningTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No tasks for today</span>
          </div>
        ) : (
          morningTasks.map((task, index) => {
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

import styles from "./Morning.module.css";
import { useState, useEffect } from "react";

export default function Morning({ morningTasks, user }) {
  const [completedTasks, setCompletedTasks] = useState(new Set());

  // Load completed tasks from localStorage when component mounts
  useEffect(() => {
    if (user?.uid) {
      const key = `morning_completed_${user.uid}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const completedArray = JSON.parse(saved);
          setCompletedTasks(new Set(completedArray));
        } catch (e) {
          console.error("Failed to parse morning completed tasks:", e);
        }
      }
    }
  }, [user?.uid]);

  // Save completed tasks to localStorage whenever they change
  useEffect(() => {
    if (user?.uid && completedTasks.size > 0) {
      const key = `morning_completed_${user.uid}`;
      const completedArray = Array.from(completedTasks);
      localStorage.setItem(key, JSON.stringify(completedArray));
    }
  }, [completedTasks, user?.uid]);

  const toggleTask = (index) => {
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className={styles.morningContainer}>
      <h4 className={styles.morningTitle}>Morning Routine</h4>

      <div className={styles.tasksList}>
        {morningTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span>No tasks for today</span>
          </div>
        ) : (
          morningTasks.map((task, index) => (
            <div key={index} className={styles.taskItem}>
              <input
                type="checkbox"
                checked={completedTasks.has(index)}
                onChange={() => toggleTask(index)}
                className={styles.checkbox}
              />
              <span
                className={`${styles.taskText} ${
                  completedTasks.has(index) ? styles.completed : ""
                }`}
              >
                {task}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

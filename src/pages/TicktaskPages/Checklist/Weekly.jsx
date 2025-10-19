import styles from "./Weekly.module.css";
import { useState, useEffect } from "react";

export default function Weekly({ weeklyTasks, user }) {
  const [completedTasks, setCompletedTasks] = useState(new Set());

  // Load completed tasks from localStorage when component mounts
  useEffect(() => {
    if (user?.uid) {
      const key = `weekly_completed_${user.uid}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const completedArray = JSON.parse(saved);
          setCompletedTasks(new Set(completedArray));
        } catch (e) {
          console.error("Failed to parse weekly completed tasks:", e);
        }
      }
    }
  }, [user?.uid]);

  // Save completed tasks to localStorage whenever they change
  useEffect(() => {
    if (user?.uid && completedTasks.size > 0) {
      const key = `weekly_completed_${user.uid}`;
      const completedArray = Array.from(completedTasks);
      localStorage.setItem(key, JSON.stringify(completedArray));
    }
  }, [completedTasks, user?.uid]);
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

  // Tasks für den aktuellen Tag
  const todayTasks = weeklyTasks?.[currentDay] || [];

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
          todayTasks.map((task, index) => (
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

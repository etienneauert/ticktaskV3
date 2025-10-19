import styles from "./Routine.module.css";
import { useState } from "react";

export default function AbendRoutine({ tasks, onUpdateTasks }) {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className={styles.routineSection}>
      <h3>Abend Routine</h3>

      <div className={styles.tasksList}>
        {tasks.length === 0 ? (
          <div className={styles.emptyPlaceholder}>
            <span>No tasks yet</span>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div key={index} className={styles.taskItem}>
              <span className={styles.bulletPoint}>•</span>
              <span className={styles.taskText}>{task}</span>
              <button
                className={styles.deleteButton}
                onClick={() => {
                  onUpdateTasks(tasks.filter((_, i) => i !== index));
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className={styles.inputContainer}>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder=""
            className={styles.routineInput}
          />
          <button
            className={styles.submitButton}
            onClick={() => {
              if (inputValue.trim()) {
                onUpdateTasks([...tasks, inputValue.trim()]);
                setInputValue("");
              }
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

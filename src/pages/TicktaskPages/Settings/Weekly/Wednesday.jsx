import styles from "./Weekly.module.css";
import { useState, useEffect } from "react";

export default function Wednesday({ tasks, onUpdateTasks }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isHovered) {
      const timer = setTimeout(() => {
        setShowInput(true);
      }, 300); // 300ms Delay - nach der Breiten-Animation
      return () => clearTimeout(timer);
    } else {
      setShowInput(false);
    }
  }, [isHovered]);

  return (
    <div
      className={styles.weeklySection}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>Wednesday</h3>
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
      <div
        className={`${styles.inputContainer} ${
          showInput ? styles.inputVisible : styles.inputHidden
        }`}
      >
        <div className={styles.inputRow}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && inputValue.trim()) {
                onUpdateTasks([...tasks, inputValue.trim()]);
                setInputValue("");
              }
            }}
            placeholder=""
            className={styles.dayInput}
          />
          <button
            className={`${styles.submitButton} ${
              inputValue.trim() ? styles.active : ""
            }`}
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

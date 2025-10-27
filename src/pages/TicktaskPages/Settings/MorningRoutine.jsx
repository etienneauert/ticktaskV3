import styles from "./Routine.module.css";
import { useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function MorningRoutine({ tasks, onUpdateTasks }) {
  const [inputValue, setInputValue] = useState("");
  const { t } = useLanguage();

  return (
    <div className={styles.routineSection}>
      <h3>{t("morningRoutine")}</h3>

      <div className={styles.tasksList}>
        {tasks.length === 0 ? (
          <div className={styles.emptyPlaceholder}>
            <span>{t("noTasksYet")}</span>
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
            onKeyPress={(e) => {
              if (e.key === "Enter" && inputValue.trim()) {
                onUpdateTasks([...tasks, inputValue.trim()]);
                setInputValue("");
              }
            }}
            placeholder=""
            className={styles.routineInput}
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

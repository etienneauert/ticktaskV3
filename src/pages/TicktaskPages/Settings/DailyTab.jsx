import styles from "./SettingsPopup.module.css";
import dailyStyles from "./Daily.module.css";
import { useState } from "react";

export default function DailyTab({ dailyTasks, onUpdateDailyTasks }) {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className={styles.tabPanel}>
      <div className={dailyStyles.dailyContainer}>
        <div className={dailyStyles.dailySection}>
          <h3>Daily Tasks</h3>

          <div className={dailyStyles.tasksList}>
            {dailyTasks.length === 0 ? (
              <div className={dailyStyles.emptyPlaceholder}>
                <span>No tasks yet</span>
              </div>
            ) : (
              dailyTasks.map((task, index) => (
                <div key={index} className={dailyStyles.taskItem}>
                  <span className={dailyStyles.bulletPoint}>•</span>
                  <span className={dailyStyles.taskText}>{task}</span>
                  <button
                    className={dailyStyles.deleteButton}
                    onClick={() => {
                      onUpdateDailyTasks(
                        dailyTasks.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={dailyStyles.inputContainer}>
            <div className={dailyStyles.inputRow}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    onUpdateDailyTasks([...dailyTasks, inputValue.trim()]);
                    setInputValue("");
                  }
                }}
                placeholder=""
                className={dailyStyles.dailyInput}
              />
              <button
                className={`${dailyStyles.submitButton} ${
                  inputValue.trim() ? dailyStyles.active : ""
                }`}
                onClick={() => {
                  if (inputValue.trim()) {
                    onUpdateDailyTasks([...dailyTasks, inputValue.trim()]);
                    setInputValue("");
                  }
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

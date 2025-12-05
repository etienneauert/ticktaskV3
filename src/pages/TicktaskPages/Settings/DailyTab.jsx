import styles from "./SettingsPopup.module.css";
import dailyStyles from "./Daily.module.css";
import { useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import arrowDown from "../../../assets/arrow-down.png";
import close3 from "../../../assets/close-3.png";

export default function DailyTab({ dailyTasks, onUpdateDailyTasks }) {
  const [inputValue, setInputValue] = useState("");
  const { t } = useLanguage();

  const handleMoveUp = (index) => {
    if (index === 0) return; // Kann nicht weiter nach oben

    const newTasks = [...dailyTasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[index - 1];
    newTasks[index - 1] = temp;
    onUpdateDailyTasks(newTasks);
  };

  const handleMoveDown = (index) => {
    if (index === dailyTasks.length - 1) return; // Kann nicht weiter nach unten

    const newTasks = [...dailyTasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[index + 1];
    newTasks[index + 1] = temp;
    onUpdateDailyTasks(newTasks);
  };

  return (
    <div className={styles.tabPanel}>
      <div className={dailyStyles.dailySection}>
        <h3>{t("dailyTasks")}</h3>

        <div className={dailyStyles.tasksList}>
          {dailyTasks.length === 0 ? (
            <div className={dailyStyles.emptyPlaceholder}>
              <span>{t("noTasksYet")}</span>
            </div>
          ) : (
            dailyTasks.map((task, index) => (
              <div key={index} className={dailyStyles.taskItem}>
                <span className={dailyStyles.bulletPoint}>•</span>
                <span className={dailyStyles.taskText}>{task}</span>
                <div className={dailyStyles.moveButtons}>
                  <button
                    className={dailyStyles.moveButton}
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Nach oben"
                  >
                    <img
                      src={arrowDown}
                      alt="↑"
                      className={dailyStyles.arrowUp}
                    />
                  </button>
                  <button
                    className={dailyStyles.moveButton}
                    onClick={() => handleMoveDown(index)}
                    disabled={index === dailyTasks.length - 1}
                    title="Nach unten"
                  >
                    <img
                      src={arrowDown}
                      alt="↓"
                      className={dailyStyles.arrowDown}
                    />
                  </button>
                </div>
                <button
                  className={dailyStyles.deleteButton}
                  onClick={() => {
                    onUpdateDailyTasks(
                      dailyTasks.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <img src={close3} alt="Delete" />
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
              placeholder="Task hinzufügen..."
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
  );
}

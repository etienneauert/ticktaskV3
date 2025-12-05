import styles from "./Weekly.module.css";
import { useState, useEffect } from "react";
import { useLanguage } from "../../../../contexts/LanguageContext";
import arrowDown from "../../../../assets/arrow-down.png";
import close3 from "../../../../assets/close-3.png";

export default function Saturday({ tasks, onUpdateTasks }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { t } = useLanguage();

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newTasks = [...tasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[index - 1];
    newTasks[index - 1] = temp;
    onUpdateTasks(newTasks);
  };

  const handleMoveDown = (index) => {
    if (index === tasks.length - 1) return;
    const newTasks = [...tasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[index + 1];
    newTasks[index + 1] = temp;
    onUpdateTasks(newTasks);
  };

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
      <h3>{t("saturday")}</h3>
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
              <div className={styles.moveButtons}>
                <button
                  className={styles.moveButton}
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  title="Nach oben"
                >
                  <img src={arrowDown} alt="↑" className={styles.arrowUp} />
                </button>
                <button
                  className={styles.moveButton}
                  onClick={() => handleMoveDown(index)}
                  disabled={index === tasks.length - 1}
                  title="Nach unten"
                >
                  <img src={arrowDown} alt="↓" className={styles.arrowDown} />
                </button>
              </div>
              <button
                className={styles.deleteButton}
                onClick={() => {
                  onUpdateTasks(tasks.filter((_, i) => i !== index));
                }}
              >
                <img src={close3} alt="Delete" />
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
            placeholder="Task hinzufügen..."
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

import styles from "./Abend.module.css";
import { useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import pen from "../../../assets/pen.png";

export default function Abend({
  abendTasks,
  user,
  completedTasks,
  setCompletedTasks,
}) {
  const { t } = useLanguage();

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

  const handlePenClick = () => {
    const event = new CustomEvent("openRoutineCustomization", {
      detail: { tabId: 1 }, // Abend Tab
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={styles.abendContainer}>
      <div className={styles.checklistHeader}>
        <h4 className={styles.abendTitle}>{t("evening")}</h4>
        <img
          id="checklist-pen-icon"
          src={pen}
          alt=""
          className={styles.penIcon}
          onClick={handlePenClick}
        />
      </div>

      <div className={styles.tasksList}>
        {abendTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span>{t("noEveningTasks")}</span>
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

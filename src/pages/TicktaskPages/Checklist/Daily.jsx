import styles from "./Daily.module.css";
import { useLanguage } from "../../../contexts/LanguageContext";
import pen from "../../../assets/pen.png";

export default function Daily({
  dailyTasks,
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
      detail: { tabId: 3 }, // Daily Tab
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={styles.dailyContainer}>
      <div className={styles.checklistHeader}>
        <h4 className={styles.dailyTitle}>{t("daily")}</h4>
        <img
          src={pen}
          alt=""
          className={styles.penIcon}
          onClick={handlePenClick}
        />
      </div>

      <div className={styles.tasksList}>
        {dailyTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span>{t("noTasksForToday")}</span>
          </div>
        ) : (
          dailyTasks.map((task, index) => {
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

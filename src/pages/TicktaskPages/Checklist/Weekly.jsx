import styles from "./Weekly.module.css";
import { useLanguage } from "../../../contexts/LanguageContext";
import pen from "../../../assets/pen.png";

export default function Weekly({
  weeklyTasks,
  user,
  completedTasks,
  setCompletedTasks,
}) {
  const { t } = useLanguage();

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

  const todayTasks = weeklyTasks?.[currentDay] || [];

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
      detail: { tabId: 2 }, // Weekly Tab
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={styles.weeklyContainer}>
      <div className={styles.checklistHeader}>
        <h4 className={styles.weeklyTitle}>{t(currentDay)}</h4>
        <img
          src={pen}
          alt=""
          className={styles.penIcon}
          onClick={handlePenClick}
        />
      </div>

      <div className={styles.tasksList}>
        {todayTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span>{t("noTasksForToday")}</span>
          </div>
        ) : (
          todayTasks.map((task, index) => {
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

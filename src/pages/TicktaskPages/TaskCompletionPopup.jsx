import styles from "./TaskCompletionPopup.module.css";
import check from "../../assets/check.png";
import plus from "../../assets/plus-sign.png";

export default function TaskCompletionPopup({
  open,
  onClose,
  onComplete,
  onAddTime,
  taskText,
}) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Time's up!</h3>
        </div>

        <div className={styles.content}>
          <p className={styles.taskText}>{taskText}</p>
          <p className={styles.question}>Is the task done?</p>
        </div>

        <div className={styles.buttons}>
          <button className={styles.completeButton} onClick={onComplete}>
            <span>I'm done!</span>
          </button>

          <button className={styles.addTimeButton} onClick={onAddTime}>
            <img src={plus} alt="Mehr Zeit" />
            <span>Add 5 min</span>
          </button>
        </div>
      </div>
    </div>
  );
}

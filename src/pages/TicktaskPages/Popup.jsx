import styles from "./popup.module.css";
import { useState, useEffect } from "react";

export default function Popup({ open, onConfirm, onCancel, taskText }) {
  const [urgent, setUrgent] = useState(false);
  const [taskDuration, setTaskDuration] = useState(0);

  // Reset state when popup opens
  useEffect(() => {
    if (open) {
      setUrgent(false);
      setTaskDuration(0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img
            onClick={onCancel}
            className={styles.close}
            src="./src/assets/close-2.png"
            alt=""
          />
        </div>
        <div className={styles.modalHeader}>
          <h1>Customize your task!</h1>
        </div>

        {/* Demo Task Preview */}
        <div className={styles.demoPreview}>
          <div className={styles.demoTask}>
            <div className={styles.demoText}>
              {taskText || "Enter task name..."}
              {urgent ? " (dringend)" : ""}
            </div>
            {taskDuration > 0 && (
              <div className={styles.demoTimer}>
                <div className={styles.demoCountdown}>{taskDuration}:00</div>
              </div>
            )}
            <div className={styles.playdelete}>
              <div className={styles.demoDelete}>
                <img src="./src/assets/play.png" alt="" />
              </div>
              <div className={styles.demoDelete}>
                <img src="./src/assets/trash-bin.png" alt="" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.Duration}>
          <h2>Add time</h2>
          <div className={styles.durationButtons}>
            <button
              type="button"
              className={
                taskDuration === 5 ? styles.active : styles.durationBtn
              }
              onClick={() => setTaskDuration(5)}
            >
              5 min
            </button>
            <button
              type="button"
              className={
                taskDuration === 15 ? styles.active : styles.durationBtn
              }
              onClick={() => setTaskDuration(15)}
            >
              15 min
            </button>
            <button
              type="button"
              className={
                taskDuration === 30 ? styles.active : styles.durationBtn
              }
              onClick={() => setTaskDuration(30)}
            >
              30 min
            </button>
            <button
              type="button"
              className={
                taskDuration === 60 ? styles.active : styles.durationBtn
              }
              onClick={() => setTaskDuration(60)}
            >
              1h
            </button>
          </div>
        </div>

        <div className={styles.Priority}>
          <h2>Add Priority</h2>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            <span>important</span>
          </label>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => onConfirm({ urgent, taskDuration })}
            className={styles.button}
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}

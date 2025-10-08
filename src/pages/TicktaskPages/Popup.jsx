import styles from "./popup.module.css";
import { useState, useEffect } from "react";

export default function Popup({ open, onConfirm, onCancel }) {
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
          <p>info</p>
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

        <div className={styles.Duration}>
          <h2>Estimated Duration</h2>
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
          <label className={styles.durationRow}>
            <span>Custom (min):</span>
            <input
              type="number"
              min="0"
              value={taskDuration}
              onChange={(e) => setTaskDuration(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
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

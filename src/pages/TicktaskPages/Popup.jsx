import styles from "./popup.module.css";
import { useState, useEffect } from "react";
import close2 from "../../assets/close-2.png";
import dot3 from "../../assets/dot-3.png";
import starWhite from "../../assets/star-white.png";
import _play from "../../assets/play.png";
import _trashBin from "../../assets/trash-bin.png";
import plusSign from "../../assets/plus-sign.png";
import playgrey from "../../assets/play-grey.png";
import trashgrey from "../../assets/trash-grey.png";
import reloadneon from "../../assets/reloadneon.png";

export default function Popup({ open, onConfirm, onCancel, taskText }) {
  const [urgent, setUrgent] = useState(false);
  const [taskDuration, setTaskDuration] = useState(0);
  const [frequent, setFrequent] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Reset state when popup opens
  useEffect(() => {
    if (open) {
      setUrgent(false);
      setTaskDuration(0);
      setFrequent(false);
      setIsRotating(false);
    }
  }, [open]);

  const handleReload = () => {
    setTaskDuration(0);
    setIsRotating(true);
    // Reset rotation state after animation completes
    setTimeout(() => setIsRotating(false), 500);
  };

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img
            onClick={onCancel}
            className={styles.close}
            src={close2}
            alt=""
          />
        </div>
        <div className={styles.modalHeader}>
          <h1>Customize your task</h1>
        </div>

        {/* Demo Task Preview */}
        <div className={styles.demoPreview}>
          <div className={styles.demoTask}>
            <div className={styles.demoText}>
              {!urgent && (
                <img src={dot3} alt="" className={styles.regularIcon} />
              )}
              {urgent && (
                <img src={starWhite} alt="" className={styles.urgentIcon} />
              )}
              {taskText || "Enter task name..."}
            </div>
            {taskDuration > 0 && (
              <div className={styles.demoTimer}>
                <div className={styles.demoCountdown}>{taskDuration}:00</div>
              </div>
            )}
            <div className={styles.playdelete}>
              <div className={styles.demoDelete}>
                <img src={playgrey} alt="" />
              </div>
              <div className={styles.demoDelete}>
                <img src={trashgrey} alt="" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.Duration}>
          <h2>Add time</h2>

          <div className={styles.durationButtons}>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 5)}
            >
              <img src={plusSign} alt="" />5 min
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 15)}
            >
              <img src={plusSign} alt="" />
              15 min
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 30)}
            >
              <img src={plusSign} alt="" />
              30 min
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 60)}
            >
              <img src={plusSign} alt="" />
              60 min
            </button>

            <img
              className={`${styles.reload} ${
                isRotating ? styles.rotating : ""
              }`}
              onClick={handleReload}
              src={reloadneon}
              alt=""
            />
          </div>
        </div>
        <div className={styles.checkboxes}>
          {taskDuration > 0 && (
            <>
              <div className={styles.Priority}>
                <h2>Add Priority</h2>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={urgent}
                    onChange={(e) => setUrgent(e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.grey}>Urgent</span>
                </label>
              </div>

              <div className={styles.Recurring}>
                <h2>Add to recurring Tasks</h2>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={frequent}
                    onChange={(e) => setFrequent(e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.grey}>Reccuring</span>
                </label>
              </div>
            </>
          )}
        </div>

        {taskDuration > 0 && (
          <div className={styles.actions}>
            <button
              onClick={() => onConfirm({ urgent, taskDuration, frequent })}
              className={styles.addButton}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import styles from "./InfoPopup.module.css";
import close from "../../../assets/close-2.png";

export default function InfoPopup({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img
            onClick={onClose}
            className={styles.closeButton}
            src={close}
            alt=""
          />
        </div>
        <div className={styles.content}>
          <h3>Idea behind TickTask</h3>
          <p>
            Fokus statt Overload: TickTask hilft dir, Aufgaben schlank zu
            planen, einen Task nach dem anderen fertig zu machen und Routinen
            klar abzuschließen.
          </p>

          <h4>How it works</h4>
          <p>
            • Erstelle Tasks oder nutze Vorlagen (Frequent).
            <br />• Starte den Timer – es läuft immer nur 1 Task parallel.
            <br />• Arbeite deine Routinen ab (Morning, Daily, Weekly, Abend)
            und beende den Tag mit „Finish Day“.
          </p>

          <h4>Tech Stack</h4>
          <p>
            React + Vite, CSS Modules
            <br />
            Firebase Auth & Firestore
            <br />
            localStorage für Offline + Timer-Recovery
          </p>
        </div>
      </div>
    </div>
  );
}

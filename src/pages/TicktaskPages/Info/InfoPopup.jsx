import styles from "./InfoPopup.module.css";
import close from "../../../assets/close-2.png";

export default function InfoPopup({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Info</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <img src={close} alt="Close" />
          </button>
        </div>
        <div className={styles.content}>
          {/* Leerer Inhalt - kann später gefüllt werden */}
        </div>
      </div>
    </div>
  );
}

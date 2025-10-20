import styles from "./ErrorMessage.module.css";
import { useEffect } from "react";

export default function ErrorMessage({ message, onClose, isVisible }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-close nach 4 Sekunden

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorMessage}>
        <span className={styles.errorText}>{message}</span>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}

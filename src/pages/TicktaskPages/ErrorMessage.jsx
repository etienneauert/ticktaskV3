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

  // Teile die Nachricht in Überschrift und Inhalt auf
  const lines = message.split("\n");
  const title = lines[0];
  const content = lines.slice(1).join("\n");

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorMessage}>
        <div className={styles.errorText}>
          <strong>{title}</strong>
          {content}
        </div>
      </div>
    </div>
  );
}

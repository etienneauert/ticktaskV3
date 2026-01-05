import styles from "./ErrorMessage.module.css";
import { useEffect, useState } from "react";

export default function ErrorMessage({ message, onClose, isVisible, buttonRef }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
        onClose();
        }, 300); // Warte auf Animation
      }, 4000); // Auto-close nach 4 Sekunden

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Warte auf Animation
  };

  if ((!isVisible && !isClosing) || !message) return null;

  // Teile die Nachricht in Überschrift und Inhalt auf
  const lines = message.split("\n");
  const title = lines[0];
  const content = lines.slice(1).join("\n");

  return (
    <div className={`${styles.errorContainer} ${buttonRef ? styles.errorContainerRelative : ""} ${isClosing ? styles.errorContainerClosing : ""}`}>
      <div className={styles.errorMessage}>
        <div className={styles.errorText}>
          <strong>{title}</strong>
          {content}
        </div>
      </div>
    </div>
  );
}

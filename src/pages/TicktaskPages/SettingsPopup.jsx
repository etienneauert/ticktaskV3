import styles from "./popup.module.css";
import { useState } from "react";
import close3 from "../../assets/close-3.png";

export default function SettingsPopup({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img onClick={onClose} className={styles.close} src={close3} alt="" />
        </div>
        <div className={styles.modalHeader}>
          <h1>Settings</h1>
        </div>

        {/* Settings Content - wird später hinzugefügt */}
        <div className={styles.settingsContent}>
          <p>Settings content will be added here...</p>
        </div>
      </div>
    </div>
  );
}

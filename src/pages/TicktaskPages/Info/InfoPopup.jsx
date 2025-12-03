import styles from "./InfoPopup.module.css";
import close from "../../../assets/close-3.png";
import { useState, useEffect, useRef } from "react";

export default function InfoPopup({ open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const buttonRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const tabs = [
    { id: 0, label: "Über Ticktask" },
    { id: 1, label: "Wie es funktioniert" },
  ];

  useEffect(() => {
    const el = buttonRefs.current[activeTab];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  useEffect(() => {
    if (open) {
      const el = buttonRefs.current[activeTab];
      if (el) {
        setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
      }
    }
  }, [open, activeTab]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalcloseandinfo}>
          <img
            onClick={onClose}
            className={styles.closeButton}
            src={close}
            alt=""
          />
        </div>
        <div className={styles.tabsContainer}>
          <div className={styles.tabsHeader}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => (buttonRefs.current[tab.id] = el)}
                className={`${styles.tabButton} ${
                  activeTab === tab.id ? styles.tabButtonActive : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <div
              className={styles.tabIndicator}
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
              </div>
          <div className={styles.tabContent}>
            {activeTab === 0 && (
              <div className={styles.tabPanel}>
                {/* Inhalt für "Über Ticktask" */}
              </div>
            )}
            {activeTab === 1 && (
              <div className={styles.tabPanel}>
                {/* Inhalt für "Wie es funktioniert" */}
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}

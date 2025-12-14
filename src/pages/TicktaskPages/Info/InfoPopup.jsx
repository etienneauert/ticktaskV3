import styles from "./InfoPopup.module.css";
import close from "../../../assets/close-3.png";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function InfoPopup({ open, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const buttonRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const { t } = useLanguage();

  const renderParagraphs = (text) => {
    const parts = String(text || "")
      .split(/\n\s*\n/g)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.map((p, idx) => <p key={idx}>{p}</p>);
  };

  const tabs = [
    { id: 0, label: t("infoTabAbout") },
    { id: 1, label: t("infoTabHowItWorks") },
  ];

  // Hintergrund-Scroll verhindern, wenn Info-Popup offen ist
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    try {
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } catch (e) {
      console.warn("Failed to lock body scroll for InfoPopup", e);
    }

    return () => {
      try {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        window.scrollTo(0, scrollY);
      } catch (e) {
        console.warn("Failed to restore body scroll for InfoPopup", e);
      }
    };
  }, [open]);

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
                <div className={`${styles.content} ${styles.aboutContent}`}>
                  {renderParagraphs(t("ideaDescription"))}
                </div>
              </div>
            )}
            {activeTab === 1 && (
              <div className={styles.tabPanel}>
                <div className={styles.content}>
                  <h4>{t("howItWorksTasksTitle")}</h4>
                  {renderParagraphs(t("howItWorksTasksBody"))}

                  <h4>{t("howItWorksCalendarTitle")}</h4>
                  {renderParagraphs(t("howItWorksCalendarBody"))}

                  <h4>{t("howItWorksGoalsTitle")}</h4>
                  {renderParagraphs(t("howItWorksGoalsBody"))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

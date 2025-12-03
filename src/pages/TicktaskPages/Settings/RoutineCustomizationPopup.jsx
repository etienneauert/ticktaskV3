import styles from "./SettingsPopup.module.css";
import { useState, useEffect, useRef } from "react";
import close3 from "../../../assets/close-3.png";
import MorningRoutine from "./MorningRoutine";
import AbendRoutine from "./AbendRoutine";
import DailyTab from "./DailyTab";
import WeeklyTab from "./WeeklyTab";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function RoutineCustomizationPopup({
  open,
  onClose,
  weeklyTasks,
  updateWeeklyTasks,
  morningTasks,
  updateMorningTasks,
  abendTasks,
  updateAbendTasks,
  dailyTasks,
  updateDailyTasks,
  user,
  initialTab = 0, // 0 = Morning, 1 = Abend, 2 = Weekly, 3 = Daily
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const buttonRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const { t } = useLanguage();

  // Setze initialen Tab wenn Popup geöffnet wird
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const tabs = [
    { id: 0, label: t("morningRoutine") },
    { id: 1, label: t("eveningRoutine") },
    { id: 2, label: t("weekly") },
    { id: 3, label: t("daily") },
  ];

  useEffect(() => {
    const el = buttonRefs.current[activeTab];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  // Initiale Positionierung beim ersten Laden
  useEffect(() => {
    if (open) {
      const el = buttonRefs.current[activeTab];
      if (el) {
        setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
      }
    }
  }, [open, activeTab]);

  // Verhindere Body-Scroll wenn Popup offen ist (nur auf Desktop)
  useEffect(() => {
    if (open) {
      // Nur auf Desktop (>= 768px) Scrolling verhindern
      const isMobile = window.innerWidth < 768;
      
      if (!isMobile) {
        const scrollY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
          document.body.style.position = "";
          document.body.style.top = "";
          document.body.style.width = "";
          document.body.style.overflow = "";
          document.documentElement.style.overflow = "";
          window.scrollTo(0, scrollY);
        };
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} ${styles.routineModal} ${
          activeTab === 2 ? styles.routineModalWeekly : ""
        }`}
      >
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img onClick={onClose} className={styles.close} src={close3} alt="" />
        </div>

        {/* Settings Content mit Custom Tabs */}
        <div className={styles.settingsContent}>
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
                  <MorningRoutine
                    tasks={morningTasks}
                    onUpdateTasks={updateMorningTasks}
                  />
                </div>
              )}
              {activeTab === 1 && (
                <div className={styles.tabPanel}>
                  <AbendRoutine
                    tasks={abendTasks}
                    onUpdateTasks={updateAbendTasks}
                  />
                </div>
              )}
              {activeTab === 2 && (
                <WeeklyTab
                  weeklyTasks={weeklyTasks}
                  updateWeeklyTasks={updateWeeklyTasks}
                />
              )}
              {activeTab === 3 && (
                <DailyTab
                  dailyTasks={dailyTasks}
                  onUpdateDailyTasks={updateDailyTasks}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

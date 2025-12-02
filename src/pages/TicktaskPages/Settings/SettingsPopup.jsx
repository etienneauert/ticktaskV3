import styles from "./SettingsPopup.module.css";
import { useState, useEffect, useRef } from "react";
import close3 from "../../../assets/close-3.png";
import RoutineTab from "./RoutineTab";
import TasksTab from "./TasksTab";
import DailyTab from "./DailyTab";
import WeeklyTab from "./WeeklyTab";
import GeneralTab from "./GeneralTab";
import CalendarTab from "./CalendarTab";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function SettingsPopup({
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
  streak,
  onResetStreak,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const buttonRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const { t } = useLanguage();

  // Prüfe ob ein bestimmter Tab geöffnet werden soll
  useEffect(() => {
    if (open) {
      const savedTab = localStorage.getItem("ticktask_settingsTab");
      if (savedTab) {
        const tabIndex = parseInt(savedTab, 10);
        setActiveTab(tabIndex);
        localStorage.removeItem("ticktask_settingsTab");
      }
    }
  }, [open]);

  const tabs = [
    { id: 1, label: t("general") },
    { id: 0, label: t("routine") },
    { id: 3, label: t("weekly") },
    { id: 2, label: t("daily") },
    { id: 4, label: "Kalender" },
  ];

  useEffect(() => {
    const el = buttonRefs.current[activeTab];
    if (el) {
      // Sofortige Positionierung, da Tabs nicht mehr von Modal-Breite beeinflusst werden
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

  // Verhindere Body-Scroll wenn Popup offen ist
  useEffect(() => {
    if (open) {
      // Speichere die aktuelle Scroll-Position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        // Stelle die Scroll-Position wieder her
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} ${activeTab === 3 ? styles.modalWide : ""}`}
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
                <RoutineTab
                  user={user}
                  morningTasks={morningTasks}
                  updateMorningTasks={updateMorningTasks}
                  abendTasks={abendTasks}
                  updateAbendTasks={updateAbendTasks}
                />
              )}
              {activeTab === 1 && (
                <GeneralTab streak={streak} onResetStreak={onResetStreak} />
              )}
              {activeTab === 2 && (
                <DailyTab
                  dailyTasks={dailyTasks}
                  onUpdateDailyTasks={updateDailyTasks}
                />
              )}
              {activeTab === 3 && (
                <>
                  {console.log(
                    "SettingsPopup: Rendering WeeklyTab with activeTab:",
                    activeTab
                  )}
                  <WeeklyTab
                    weeklyTasks={weeklyTasks}
                    updateWeeklyTasks={updateWeeklyTasks}
                  />
                </>
              )}
              {activeTab === 4 && <CalendarTab user={user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

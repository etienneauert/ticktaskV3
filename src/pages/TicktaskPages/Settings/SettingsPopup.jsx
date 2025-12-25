import styles from "./SettingsPopup.module.css";
import { useState, useEffect, useRef } from "react";
import close3 from "../../../assets/close-3.png";
import GeneralTab from "./GeneralTab";
import CalendarTab from "./CalendarTab";
import GoalsTab from "./GoalsTab";
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
  tasks,
  isGuestMode,
  updateGuestData,
  guestData,
  onResetApp,
  onOpenWelcome,
}) {
  const [activeTab, setActiveTab] = useState(1); // General Tab
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
      } else {
        // Standard: General Tab (id: 1)
        setActiveTab(1);
      }
    }
  }, [open]);

  const tabs = [
    { id: 1, label: t("general") },
    { id: 2, label: t("goals") },
    { id: 4, label: t("navCalendar") },
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

  // Verhindere Body-Scroll wenn Popup offen ist (nur auf Desktop)
  useEffect(() => {
    if (open) {
      // Nur auf Desktop (>= 768px) Scrolling verhindern
      const isMobile = window.innerWidth < 768;

      if (!isMobile) {
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
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
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
              {activeTab === 1 && (
                <GeneralTab
                  streak={streak}
                  onResetStreak={onResetStreak}
                  user={user}
                  onResetApp={onResetApp}
                  onOpenWelcome={onOpenWelcome}
                  onClose={onClose}
                />
              )}
              {activeTab === 2 && <GoalsTab user={user} />}
              {activeTab === 4 && <CalendarTab user={user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

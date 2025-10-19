import styles from "./SettingsPopup.module.css";
import { useState, useEffect, useRef } from "react";
import close2 from "../../../assets/close-2.png";
import RoutineTab from "./RoutineTab";
import TasksTab from "./TasksTab";
import DailyTab from "./DailyTab";
import WeeklyTab from "./WeeklyTab";

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
}) {
  const [activeTab, setActiveTab] = useState(0);
  const buttonRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const tabs = [
    { id: 0, label: "Routine" },
    { id: 1, label: "Tasks" },
    { id: 3, label: "Weekly" },
    { id: 2, label: "Daily" },
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

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modal} ${activeTab === 3 ? styles.modalWide : ""}`}
      >
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img onClick={onClose} className={styles.close} src={close2} alt="" />
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
              {activeTab === 1 && <TasksTab />}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Task } from "./Task";
import styles from "./MainTasks.module.css";
import { useState, useEffect, useRef } from "react";
import arrowDown from "../../assets/arrow-down.png";
import { useLanguage } from "../../contexts/LanguageContext";

export default function MainTasks({
  tasks = [],
  frequentTemplates = [],
  onDelete,
  onTaskDone,
  onEdit,
  onFrequentDelete,
  onCopyTask,
  runningTaskId,
  onTaskStart,
  onTaskStop,
  onClearAllDone,
}) {
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [showFrequentTasks, setShowFrequentTasks] = useState(false);
  const frequentTasksTimeoutRef = useRef(null);
  const { t } = useLanguage();
  // Filtere Tasks: nicht abgeschlossene Tasks für die normale Liste
  const activeTasks = tasks.filter((task) => !task.done);
  const doneTasks = tasks.filter((task) => task.done);
  // Kombiniere frequent tasks aus tasks und frequentTemplates
  const frequentTasks = [
    ...tasks.filter((task) => task.frequent),
    ...frequentTemplates,
  ];

  // Debug: Log frequent tasks
  console.log("All tasks:", tasks);
  console.log("Frequent tasks:", frequentTasks);

  // Auto-close Frequent Tasks nach 10 Sekunden
  useEffect(() => {
    if (showFrequentTasks) {
      // Clear existing timeout
      if (frequentTasksTimeoutRef.current) {
        clearTimeout(frequentTasksTimeoutRef.current);
      }

      // Set new timeout
      frequentTasksTimeoutRef.current = setTimeout(() => {
        setShowFrequentTasks(false);
      }, 10000); // 10 Sekunden
    } else {
      // Clear timeout when closed manually
      if (frequentTasksTimeoutRef.current) {
        clearTimeout(frequentTasksTimeoutRef.current);
        frequentTasksTimeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (frequentTasksTimeoutRef.current) {
        clearTimeout(frequentTasksTimeoutRef.current);
      }
    };
  }, [showFrequentTasks]);

  // Sortiere aktive Tasks: Dringende zuerst, dann normale Tasks nach Erstellungsdatum
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
    // Dringende Tasks zuerst
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;

    // Wenn beide urgent oder beide nicht urgent sind, nach Erstellungsdatum
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;

    // Für dringende Tasks: neueste zuerst
    if (a.urgent && b.urgent) {
      return bTime - aTime;
    }

    // Für normale Tasks: älteste zuerst (neue kommen unten hin)
    if (!a.urgent && !b.urgent) {
      return aTime - bTime;
    }

    return 0;
  });

  // Sortiere abgeschlossene Tasks nach Abschlussdatum (neueste zuerst)
  const sortedDoneTasks = [...doneTasks].sort((a, b) => {
    const aTime = a.completedAt?.seconds || 0;
    const bTime = b.completedAt?.seconds || 0;
    return bTime - aTime;
  });

  // Sortiere frequent Tasks nach Abschlussdatum (neueste zuerst)
  const sortedFrequentTasks = [...frequentTasks].sort((a, b) => {
    const aTime = a.completedAt?.seconds || 0;
    const bTime = b.completedAt?.seconds || 0;
    return bTime - aTime;
  });

  // Prüfe ob alle Listen leer sind
  const isEmpty =
    activeTasks.length === 0 &&
    doneTasks.length === 0 &&
    frequentTasks.length === 0;

  return (
    <div>
      {isEmpty ? (
        <div className={styles.emptyMessage}>Die Task liste ist leer</div>
      ) : (
        <>
          <Task
            tasks={sortedActiveTasks}
            onDelete={onDelete}
            onTaskDone={onTaskDone}
            runningTaskId={runningTaskId}
            onTaskStart={onTaskStart}
            onTaskStop={onTaskStop}
          ></Task>
          {doneTasks.length > 0 && (
            <div
              className={`${styles.DoneTasks} ${
                activeTasks.length === 0 ? styles.noMarginTop : ""
              } ${showDoneTasks ? styles.DoneTasksExpanded : ""}`}
            >
              <div
                className={styles.DoneTasksHeader}
                onClick={() => setShowDoneTasks(!showDoneTasks)}
              >
                <div className={styles.headerLeft}>
                  <h3>
                    {t("doneTasks")}
                    <span className={styles.length}>{doneTasks.length}</span>
                  </h3>
                  {showDoneTasks && doneTasks.length > 0 && (
                    <button
                      className={styles.clearAllButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(t("confirmClearAll"))) {
                          onClearAllDone?.();
                        }
                      }}
                    >
                      {t("clearAll")}
                    </button>
                  )}
                </div>
                <img
                  src={arrowDown}
                  alt=""
                  className={`${styles.arrow} ${
                    showDoneTasks ? styles.arrowUp : styles.arrowDown
                  }`}
                />
              </div>

              {showDoneTasks && doneTasks.length > 0 && (
                <Task
                  tasks={sortedDoneTasks}
                  onDelete={onDelete}
                  onTaskDone={onTaskDone}
                  isDoneList={true}
                  runningTaskId={runningTaskId}
                  onTaskStart={onTaskStart}
                  onTaskStop={onTaskStop}
                ></Task>
              )}
            </div>
          )}

          {frequentTasks.length > 0 && (
            <div
              className={`${styles.FrequentTasks} ${
                doneTasks.length === 0 && activeTasks.length === 0
                  ? styles.noMarginTop
                  : ""
              } ${showFrequentTasks ? styles.FrequentTasksExpanded : ""}`}
            >
              <div
                className={styles.FrequentTasksHeader}
                onClick={() => {
                  setShowFrequentTasks(!showFrequentTasks);
                  // Reset timeout when manually toggling
                  if (frequentTasksTimeoutRef.current) {
                    clearTimeout(frequentTasksTimeoutRef.current);
                    frequentTasksTimeoutRef.current = null;
                  }
                }}
              >
                <h3>
                  {t("frequentTasks")}
                  <span className={styles.length}>{frequentTasks.length}</span>
                </h3>
                <img
                  src={arrowDown}
                  alt=""
                  className={`${styles.arrow} ${
                    showFrequentTasks ? styles.arrowUp : styles.arrowDown
                  }`}
                />
              </div>

              {showFrequentTasks && frequentTasks.length > 0 && (
                <Task
                  tasks={sortedFrequentTasks}
                  onDelete={(task) => {
                    onFrequentDelete(task);
                    // Reset timeout when interacting with tasks
                    if (frequentTasksTimeoutRef.current) {
                      clearTimeout(frequentTasksTimeoutRef.current);
                      frequentTasksTimeoutRef.current = setTimeout(() => {
                        setShowFrequentTasks(false);
                      }, 10000);
                    }
                  }}
                  onTaskDone={(task) => {
                    onTaskDone(task);
                    // Reset timeout when interacting with tasks
                    if (frequentTasksTimeoutRef.current) {
                      clearTimeout(frequentTasksTimeoutRef.current);
                      frequentTasksTimeoutRef.current = setTimeout(() => {
                        setShowFrequentTasks(false);
                      }, 10000);
                    }
                  }}
                  onEdit={onEdit}
                  onCopyTask={(task) => {
                    onCopyTask(task);
                    // Reset timeout when interacting with tasks
                    if (frequentTasksTimeoutRef.current) {
                      clearTimeout(frequentTasksTimeoutRef.current);
                      frequentTasksTimeoutRef.current = setTimeout(() => {
                        setShowFrequentTasks(false);
                      }, 10000);
                    }
                  }}
                  isDoneList={true}
                  isFrequentList={true}
                  runningTaskId={runningTaskId}
                  onTaskStart={onTaskStart}
                  onTaskStop={onTaskStop}
                ></Task>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

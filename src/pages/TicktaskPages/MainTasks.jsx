import { Task } from "./Task";
import styles from "./MainTasks.module.css";
import { useState } from "react";
import arrowDown from "../../assets/arrow-down.png";

export default function MainTasks({
  tasks = [],
  frequentTemplates = [],
  onDelete,
  onTaskDone,
  onEdit,
  onFrequentDelete,
  onCopyTask,
}) {
  const [showDoneTasks, setShowDoneTasks] = useState(false);
  const [showFrequentTasks, setShowFrequentTasks] = useState(false);
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

  return (
    <div>
      <Task
        tasks={sortedActiveTasks}
        onDelete={onDelete}
        onTaskDone={onTaskDone}
      ></Task>
      {doneTasks.length > 0 && (
        <div className={styles.DoneTasks}>
          <div
            className={styles.DoneTasksHeader}
            onClick={() => setShowDoneTasks(!showDoneTasks)}
          >
            <h3>
              Done Tasks
              <span className={styles.length}>{doneTasks.length}</span>
            </h3>
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
            ></Task>
          )}
        </div>
      )}

      {frequentTasks.length > 0 && (
        <div className={styles.FrequentTasks}>
          <div
            className={styles.FrequentTasksHeader}
            onClick={() => setShowFrequentTasks(!showFrequentTasks)}
          >
            <h3>
              Frequent Tasks
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
              onDelete={onFrequentDelete}
              onTaskDone={onTaskDone}
              onEdit={onEdit}
              onCopyTask={onCopyTask}
              isDoneList={true}
              isFrequentList={true}
            ></Task>
          )}
        </div>
      )}
    </div>
  );
}

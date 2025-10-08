import { Task } from "./Task";
import styles from "./MainTasks.module.css";

export default function MainTasks({ tasks = [], onDelete }) {
  // Sortiere Tasks: Dringende zuerst, dann normale Tasks nach Erstellungsdatum
  const sortedTasks = [...tasks].sort((a, b) => {
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

  return (
    <div>
      <div className={styles.taskCounter}>{tasks.length} Tasks to go</div>
      <Task tasks={sortedTasks} onDelete={onDelete}></Task>
    </div>
  );
}

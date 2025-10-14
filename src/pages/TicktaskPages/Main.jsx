import MainTasks from "./MainTasks";
import MainRoutine from "./MainRoutine";
import styles from "./Main.module.css";

export default function Main({
  tasks,
  frequentTemplates,
  onDelete,
  onTaskDone,
  onEdit,
  onFrequentDelete,
  onCopyTask,
}) {
  return (
    <div className={styles.Main}>
      <div className={styles.MainRoutine}>
        <MainRoutine></MainRoutine>
      </div>
      <div className={styles.MainTasks}>
        <MainTasks
          tasks={tasks}
          frequentTemplates={frequentTemplates}
          onDelete={onDelete}
          onTaskDone={onTaskDone}
          onEdit={onEdit}
          onFrequentDelete={onFrequentDelete}
          onCopyTask={onCopyTask}
        ></MainTasks>
      </div>
      <div className={styles.MainRoutine}>
        <MainRoutine></MainRoutine>
      </div>
    </div>
  );
}

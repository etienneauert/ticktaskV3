import MainTasks from "./MainTasks";
import MainRoutine from "./MainRoutine";
import styles from "./Main.module.css";

export default function Main({ tasks, onDelete }) {
  return (
    <div className={styles.Main}>
      <div className={styles.MainRoutine}>
        <MainRoutine></MainRoutine>
      </div>
      <div className={styles.MainTasks}>
        <MainTasks tasks={tasks} onDelete={onDelete}></MainTasks>
      </div>
    </div>
  );
}

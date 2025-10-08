import styles from "./MorningRoutine.module.css";

export function MorningRoutine() {
  return (
    <div className={styles.MorningRoutine}>
      <div className={styles.header}>
        <h1>Morning Routine</h1>
      </div>
      <div className={styles.routineTasks}></div>
    </div>
  );
}

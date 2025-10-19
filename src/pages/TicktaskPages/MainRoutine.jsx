import Morning from "./Routine/Morning";
import Abend from "./Routine/Abend";
import styles from "./MainRoutine.module.css";

export default function MainRoutine({
  morningTasks,
  abendTasks,
  user,
  morningCompleted,
  setMorningCompleted,
  abendCompleted,
  setAbendCompleted,
}) {
  return (
    <div className={styles.main}>
      <Morning
        morningTasks={morningTasks}
        user={user}
        completedTasks={morningCompleted}
        setCompletedTasks={setMorningCompleted}
      />
      <div className={styles.spacing}></div>
      <Abend
        abendTasks={abendTasks}
        user={user}
        completedTasks={abendCompleted}
        setCompletedTasks={setAbendCompleted}
      />
    </div>
  );
}

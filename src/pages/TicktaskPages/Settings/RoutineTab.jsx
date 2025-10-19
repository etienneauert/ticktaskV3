import styles from "./SettingsPopup.module.css";
import routineStyles from "./Routine.module.css";
import MorningRoutine from "./MorningRoutine";
import AbendRoutine from "./AbendRoutine";

export default function RoutineTab({
  morningTasks,
  updateMorningTasks,
  abendTasks,
  updateAbendTasks,
}) {
  return (
    <div className={styles.tabPanel}>
      <div className={routineStyles.routineContainer}>
        <MorningRoutine
          tasks={morningTasks}
          onUpdateTasks={updateMorningTasks}
        />
        <AbendRoutine tasks={abendTasks} onUpdateTasks={updateAbendTasks} />
      </div>
    </div>
  );
}

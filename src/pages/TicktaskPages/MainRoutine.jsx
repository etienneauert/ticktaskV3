import { MorningRoutine } from "./Morningroutine";
import styles from "./MainRoutine.module.css";
export default function MainRoutine() {
  return (
    <div className={styles.main}>
      <MorningRoutine></MorningRoutine>
    </div>
  );
}

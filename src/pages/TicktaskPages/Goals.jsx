import { useState, useEffect } from "react";
import styles from "./Goals.module.css";
import rightArrow2 from "../../assets/right-arrow-2.png";
import close3 from "../../assets/close-3.png";
import GoalsPopup from "./GoalsPopup";
import { db } from "../../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";

export default function Goals({ user, tasks = [] }) {
  const [value, setValue] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState([]);

  // Debug: Log tasks when they change
  useEffect(() => {
    console.log("[Goals] Tasks updated:", tasks.length, "tasks");
    console.log(
      "[Goals] All tasks:",
      tasks.map((t) => ({
        id: t.id,
        text: t.text,
        goalId: t.goalId,
        done: t.done,
        actualTimeUsed: t.actualTimeUsed,
      }))
    );
    const tasksWithGoals = tasks.filter((t) => t.goalId);
    console.log(
      "[Goals] Tasks with goals:",
      tasksWithGoals.length,
      tasksWithGoals
    );
    const completedTasksWithGoals = tasks.filter((t) => t.goalId && t.done);
    console.log(
      "[Goals] Completed tasks with goals:",
      completedTasksWithGoals.length,
      completedTasksWithGoals
    );
  }, [tasks]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setOpen(true);
  };

  const confirmAdd = async (data) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (!user?.uid) {
      console.warn("User not logged in, cannot save goal");
      setValue("");
      setOpen(false);
      return;
    }

    try {
      const goalsCol = collection(db, "users", user.uid, "goals");
      const goalData = {
        text: trimmed,
        targetDate: data.targetDate || null,
        priority: data.priority || "low",
        hoursNeeded: data.hoursNeeded || null,
        createdAt: serverTimestamp(),
      };

      await addDoc(goalsCol, goalData);
      console.log("Goal hinzugefügt:", goalData);

      // Dispatch Event für automatische Aktualisierung im Popup
      window.dispatchEvent(
        new CustomEvent("goalsChanged", {
          detail: { action: "added" },
        })
      );

      setValue("");
      setOpen(false);
    } catch (e) {
      console.error("Failed to save goal to Firebase", e);
      setValue("");
      setOpen(false);
    }
  };

  const cancelAdd = () => {
    setOpen(false);
  };

  // Lösche ein Goal
  const handleDeleteGoal = async (goalId) => {
    if (!user?.uid || !goalId) return;

    try {
      const goalDoc = doc(db, "users", user.uid, "goals", goalId);
      await deleteDoc(goalDoc);
      console.log("Goal gelöscht:", goalId);

      // Aktualisiere die Goals-Liste
      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));

      // Dispatch Event für automatische Aktualisierung im Popup
      window.dispatchEvent(
        new CustomEvent("goalsChanged", {
          detail: { action: "deleted" },
        })
      );
    } catch (e) {
      console.error("Failed to delete goal", e);
    }
  };

  // Lade Goals aus Firebase
  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.uid) {
        setGoals([]);
        return;
      }

      try {
        const goalsCol = collection(db, "users", user.uid, "goals");
        const goalsSnapshot = await getDocs(goalsCol);
        const goalsList = goalsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setGoals(goalsList);
      } catch (e) {
        console.error("Failed to load goals", e);
      }
    };

    loadGoals();

    // Höre auf Goals-Änderungen
    const handleGoalsChanged = () => {
      loadGoals();
    };

    window.addEventListener("goalsChanged", handleGoalsChanged);
    return () => {
      window.removeEventListener("goalsChanged", handleGoalsChanged);
    };
  }, [user?.uid]);

  // Berechne die bereits gearbeitete Zeit für jedes Goal
  const calculateTimeSpent = (goalId) => {
    if (!goalId || !tasks || tasks.length === 0) {
      console.log(
        `[Goals] calculateTimeSpent: No goalId or no tasks. goalId=${goalId}, tasks.length=${
          tasks?.length || 0
        }`
      );
      return 0;
    }

    // Filtere alle Tasks, die diesem Goal zugewiesen sind und erledigt wurden
    // Verwende String-Vergleich für goalId, da es möglicherweise als String gespeichert wird
    const goalTasks = tasks.filter((task) => {
      const taskGoalId = task.goalId ? String(task.goalId) : null;
      const targetGoalId = String(goalId);
      const matches =
        taskGoalId === targetGoalId &&
        task.done === true &&
        task.taskDuration !== undefined &&
        task.taskDuration !== null;

      if (task.goalId && !matches) {
        console.log(
          `[Goals] Task ${task.id} doesn't match: task.goalId="${taskGoalId}", target="${targetGoalId}", done=${task.done}, taskDuration=${task.taskDuration}`
        );
      }

      return matches;
    });

    // Debug: Log für Troubleshooting
    if (goalTasks.length > 0) {
      console.log(
        `[Goals] Goal ${goalId} - Found ${goalTasks.length} completed tasks:`,
        goalTasks.map((t) => ({
          id: t.id,
          text: t.text,
          goalId: t.goalId,
          done: t.done,
          taskDuration: t.taskDuration,
        }))
      );
    }

    // Summiere alle taskDuration Werte (in Minuten)
    const totalMinutes = goalTasks.reduce((sum, task) => {
      // taskDuration ist in Minuten gespeichert
      const timeUsed = parseInt(task.taskDuration) || 0;
      console.log(
        `[Goals] Task ${task.id}: taskDuration = ${task.taskDuration}, parsed = ${timeUsed} minutes`
      );
      return sum + timeUsed;
    }, 0);

    // Konvertiere zu Stunden (1 Stunde = 60 Minuten)
    const hours = totalMinutes / 60;
    console.log(
      `[Goals] Goal ${goalId}: Total = ${totalMinutes} minutes = ${hours} hours`
    );
    return hours;
  };

  return (
    <>
      <div className={styles.GoalsContainer}>
        <h3 className={styles.GoalsTitle}>Goals</h3>
        <form className={styles.GoalsInputContainer} onSubmit={handleSubmit}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Goal hinzufügen..."
            className={isShaking ? styles.shake : ""}
          />
          <button
            type="submit"
            className={`${styles.submitButton} ${
              value.trim() ? styles.submitButtonActive : ""
            }`}
          >
            <img src={rightArrow2} alt="" />
          </button>
        </form>

        {/* Goals Liste */}
        <div className={styles.GoalsList}>
          {goals.map((goal) => {
            const timeSpent = calculateTimeSpent(goal.id);
            const maxHours = goal.hoursNeeded || 0;
            const progress =
              maxHours > 0 ? Math.min((timeSpent / maxHours) * 100, 100) : 0;

            console.log(
              `[Goals] Rendering goal "${goal.text}": timeSpent=${timeSpent}h, maxHours=${maxHours}h, progress=${progress}%`
            );

            return (
              <div key={goal.id} className={styles.GoalItem}>
                <div className={styles.GoalItemHeader}>
                  <div className={styles.GoalText}>{goal.text}</div>
                  <button
                    className={styles.GoalDeleteButton}
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <img src={close3} alt="Delete" />
                  </button>
                </div>
                <div className={styles.GoalProgressContainer}>
                  <div className={styles.GoalProgressBar}>
                    {progress > 0 && (
                      <div
                        className={styles.GoalProgressFill}
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                  {maxHours > 0 && (
                    <div className={styles.GoalProgressText}>
                      {timeSpent.toFixed(1)}h / {maxHours}h
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <GoalsPopup
        open={open}
        onConfirm={confirmAdd}
        onCancel={cancelAdd}
        goalText={value}
        user={user}
      />
    </>
  );
}

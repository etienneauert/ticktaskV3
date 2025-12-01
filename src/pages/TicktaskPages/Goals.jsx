import { useState, useEffect } from "react";
import styles from "./Goals.module.css";
import rightArrow2 from "../../assets/right-arrow-2.png";
import close3 from "../../assets/close-3.png";
import starWhite from "../../assets/star-white.png";
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

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
        timeSpent: 0, // Zeit in Minuten, initialisiert mit 0
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

  // Öffne Delete-Bestätigungs-Popup
  const handleDeleteClick = (goal) => {
    setGoalToDelete(goal);
    setDeleteConfirmOpen(true);
  };

  // Lösche ein Goal nach Bestätigung
  const handleDeleteGoal = async () => {
    if (!user?.uid || !goalToDelete) return;

    try {
      const goalDoc = doc(db, "users", user.uid, "goals", goalToDelete.id);
      await deleteDoc(goalDoc);
      console.log("Goal gelöscht:", goalToDelete.id);

      // Aktualisiere die Goals-Liste
      setGoals((prev) => prev.filter((goal) => goal.id !== goalToDelete.id));

      // Dispatch Event für automatische Aktualisierung im Popup
      window.dispatchEvent(
        new CustomEvent("goalsChanged", {
          detail: { action: "deleted" },
        })
      );

      // Schließe das Popup
      setDeleteConfirmOpen(false);
      setGoalToDelete(null);
    } catch (e) {
      console.error("Failed to delete goal", e);
      setDeleteConfirmOpen(false);
      setGoalToDelete(null);
    }
  };

  // Abbrechen beim Delete-Popup
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setGoalToDelete(null);
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

  // Lese die gespeicherte Zeit für ein Goal (aus dem Goal-Dokument)
  const getTimeSpent = (goal) => {
    // timeSpent ist in Minuten im Goal-Dokument gespeichert
    const timeSpentMinutes = goal.timeSpent || 0;
    // Konvertiere zu Stunden
    return timeSpentMinutes / 60;
  };

  // Formatiere Datum für Anzeige
  const formatDate = (dateValue) => {
    if (!dateValue) return null;

    // Wenn es ein Timestamp-Objekt ist (von Firebase)
    if (dateValue.seconds) {
      const date = new Date(dateValue.seconds * 1000);
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    // Wenn es ein String ist (ISO-Format)
    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    return null;
  };

  // Formatiere Erstellungsdatum
  const formatCreatedDate = (goal) => {
    if (!goal.createdAt) return null;
    return formatDate(goal.createdAt);
  };

  // Berechne verbleibende Tage bis zum Zieldatum
  const getDaysUntilTarget = (goal) => {
    if (!goal.targetDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetDate;
    if (typeof goal.targetDate === "string") {
      targetDate = new Date(goal.targetDate);
    } else {
      return null;
    }

    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
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
            const timeSpent = getTimeSpent(goal);
            const maxHours = goal.hoursNeeded || 0;
            const progress =
              maxHours > 0 ? Math.min((timeSpent / maxHours) * 100, 100) : 0;

            console.log(
              `[Goals] Rendering goal "${goal.text}": timeSpent=${timeSpent}h, maxHours=${maxHours}h, progress=${progress}%`
            );

            return (
              <div key={goal.id} className={styles.GoalItem}>
                <div className={styles.GoalItemHeader}>
                  <div className={styles.GoalTextContainer}>
                    {goal.priority === "high" && (
                      <img
                        src={starWhite}
                        alt=""
                        className={styles.GoalPriorityIcon}
                      />
                    )}
                    <div className={styles.GoalText}>{goal.text}</div>
                  </div>
                  <button
                    className={styles.GoalDeleteButton}
                    onClick={() => handleDeleteClick(goal)}
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
                  <div className={styles.GoalProgressInfo}>
                    <div className={styles.GoalDatesContainer}>
                      {formatCreatedDate(goal) && (
                        <div className={styles.GoalDate}>
                          <span className={styles.GoalDateLabel}>
                            Erstellt:
                          </span>
                          <span className={styles.GoalDateValue}>
                            {formatCreatedDate(goal)}
                          </span>
                        </div>
                      )}
                      {goal.targetDate && (
                        <div className={styles.GoalDate}>
                          <span className={styles.GoalDateLabel}>Ziel:</span>
                          <span className={styles.GoalDateValue}>
                            {formatDate(goal.targetDate)}
                          </span>
                          {getDaysUntilTarget(goal) !== null && (
                            <span
                              className={`${styles.GoalDaysRemaining} ${
                                getDaysUntilTarget(goal) > 0 &&
                                getDaysUntilTarget(goal) <= 10
                                  ? styles.GoalDaysRemainingUrgent
                                  : ""
                              }`}
                            >
                              {getDaysUntilTarget(goal) > 0
                                ? `${getDaysUntilTarget(goal)} Tage verbleibend`
                                : getDaysUntilTarget(goal) === 0
                                ? "Heute"
                                : `${Math.abs(
                                    getDaysUntilTarget(goal)
                                  )} Tage überfällig`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {maxHours > 0 && (
                      <div className={styles.GoalProgressText}>
                        {timeSpent.toFixed(1)}h / {maxHours}h
                      </div>
                    )}
                  </div>
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

      {/* Delete Confirmation Popup */}
      {deleteConfirmOpen && goalToDelete && (
        <div
          className={styles.deleteConfirmOverlay}
          onClick={handleDeleteCancel}
        >
          <div
            className={styles.deleteConfirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteConfirmHeader}>
              <img
                onClick={handleDeleteCancel}
                className={styles.deleteConfirmClose}
                src={close3}
                alt=""
              />
            </div>
            <div className={styles.deleteConfirmContent}>
              <h2>Goal löschen?</h2>
              <p>
                Möchtest du das Goal "{goalToDelete.text}" wirklich löschen?
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <div className={styles.deleteConfirmActions}>
              <button
                onClick={handleDeleteCancel}
                className={styles.deleteConfirmCancelButton}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteGoal}
                className={styles.deleteConfirmDeleteButton}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

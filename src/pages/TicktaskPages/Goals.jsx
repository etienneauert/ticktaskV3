import { useState, useEffect } from "react";
import styles from "./Goals.module.css";
import rightArrow2 from "../../assets/right-arrow-2.png";
import close3 from "../../assets/close-3.png";
import trashBin from "../../assets/trash-bin.png";
import starWhite from "../../assets/star-white.png";
import arrowDown from "../../assets/arrow-down.png";
import GoalsPopup from "./GoalsPopup";
import { db } from "../../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  deleteDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

export default function Goals({ user, tasks = [] }) {
  const [value, setValue] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [goalReachedOpen, setGoalReachedOpen] = useState(false);
  const [goalReached, setGoalReached] = useState(null);
  const [shownGoalReachedIds, setShownGoalReachedIds] = useState(new Set());
  const [showDoneGoals, setShowDoneGoals] = useState(false);
  const [expandedGoalIds, setExpandedGoalIds] = useState(new Set());
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [goalToComplete, setGoalToComplete] = useState(null);

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

  // Lade Goals aus Firebase mit Echtzeit-Listener
  useEffect(() => {
    if (!user?.uid) {
      setGoals([]);
      return;
    }

    const goalsCol = collection(db, "users", user.uid, "goals");

    // Verwende onSnapshot für Echtzeit-Updates
    const unsubscribe = onSnapshot(
      goalsCol,
      (snapshot) => {
        const goalsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGoals(goalsList);
        console.log(
          "✅ Goals updated from Firebase:",
          goalsList.length,
          "goals"
        );
      },
      (error) => {
        console.error("Failed to subscribe to goals", error);
      }
    );

    // Höre auch auf Custom Events für zusätzliche Updates (z.B. beim Hinzufügen/Löschen)
    const handleGoalsChanged = () => {
      // onSnapshot aktualisiert automatisch, aber wir können hier zusätzliche Logik hinzufügen
      console.log("Goals changed event received");
    };

    window.addEventListener("goalsChanged", handleGoalsChanged);

    return () => {
      unsubscribe();
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

  // Prüfe, ob ein Goal die Stundenanzahl erreicht hat
  useEffect(() => {
    if (!goals || goals.length === 0) return;

    goals.forEach((goal) => {
      if (!goal.id) return;

      // Überspringe bereits erledigte Goals
      if (goal.completed) return;

      const timeSpent = getTimeSpent(goal);
      const maxHours = goal.hoursNeeded || 0;

      console.log(
        `[Goal Reached Check] Goal: ${
          goal.text
        }, timeSpent: ${timeSpent}h, maxHours: ${maxHours}h, shown: ${shownGoalReachedIds.has(
          goal.id
        )}`
      );

      // Prüfe, ob das Goal erreicht wurde und noch nicht angezeigt wurde
      // Verwende eine kleine Toleranz (0.01) für Rundungsfehler
      if (
        maxHours > 0 &&
        timeSpent >= maxHours - 0.01 &&
        !shownGoalReachedIds.has(goal.id)
      ) {
        console.log(`[Goal Reached] Showing popup for goal: ${goal.text}`);
        setGoalReached(goal);
        setGoalReachedOpen(true);
        setShownGoalReachedIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(goal.id);
          return newSet;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  // Handler für Goal-Erreichungs-Popup
  const handleGoalReachedClose = async (isCompleted = false) => {
    if (isCompleted && goalReached && user?.uid) {
      try {
        const goalDoc = doc(db, "users", user.uid, "goals", goalReached.id);
        await updateDoc(goalDoc, {
          completed: true,
          completedAt: serverTimestamp(),
        });
        console.log("Goal marked as completed:", goalReached.id);
      } catch (e) {
        console.error("Failed to mark goal as completed", e);
      }
    }
    setGoalReachedOpen(false);
    setGoalReached(null);
  };

  // Handler für "Ziel erreicht" Button - öffnet Bestätigungs-Popup
  const handleGoalCompleted = (goal) => {
    setGoalToComplete(goal);
    setCompleteConfirmOpen(true);
  };

  // Handler für Bestätigung des "Ziel erreicht" Popups
  const handleCompleteConfirm = async () => {
    if (!user?.uid || !goalToComplete) return;

    try {
      const goalDoc = doc(db, "users", user.uid, "goals", goalToComplete.id);
      await updateDoc(goalDoc, {
        completed: true,
        completedAt: serverTimestamp(),
      });
      console.log("Goal marked as completed:", goalToComplete.id);
    } catch (e) {
      console.error("Failed to mark goal as completed", e);
    } finally {
      setCompleteConfirmOpen(false);
      setGoalToComplete(null);
    }
  };

  // Handler für Abbrechen des "Ziel erreicht" Popups
  const handleCompleteCancel = () => {
    setCompleteConfirmOpen(false);
    setGoalToComplete(null);
  };

  // Handler für "Alle löschen" Button bei erledigten Goals
  const handleClearAllDoneGoals = async () => {
    if (!user?.uid) return;

    const completedGoals = goals.filter((goal) => goal.completed);
    if (completedGoals.length === 0) return;

    if (window.confirm("Möchtest du wirklich alle erledigten Goals löschen?")) {
      try {
        const deletePromises = completedGoals.map((goal) => {
          const goalDoc = doc(db, "users", user.uid, "goals", goal.id);
          return deleteDoc(goalDoc);
        });
        await Promise.all(deletePromises);
        console.log("All completed goals deleted");
      } catch (e) {
        console.error("Failed to delete completed goals", e);
      }
    }
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
        <form className={styles.GoalsInputContainer} onSubmit={handleSubmit}>
          <input
            id="goals-input"
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
          {goals.filter((goal) => !goal.completed).length === 0 ? (
            <div className={styles.GoalsEmptyState}>
              Noch keine Ziele definiert
            </div>
          ) : (
            goals
              .filter((goal) => !goal.completed)
              .sort((a, b) => {
                // Goals mit hoher Priorität zuerst
                if (a.priority === "high" && b.priority !== "high") return -1;
                if (a.priority !== "high" && b.priority === "high") return 1;
                return 0;
              })
              .map((goal) => {
                const timeSpent = getTimeSpent(goal);
                const maxHours = goal.hoursNeeded || 0;
                const progress =
                  maxHours > 0
                    ? Math.min((timeSpent / maxHours) * 100, 100)
                    : 0;

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
                        <img src={trashBin} alt="Delete" />
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
                              <span className={styles.GoalDateLabel}>
                                Ziel:
                              </span>
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
                                    ? `${getDaysUntilTarget(
                                        goal
                                      )} Tage verbleibend`
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
                        <div className={styles.GoalProgressRight}>
                          <div className={styles.GoalActionButtons}>
                            <button
                              className={styles.GoalCompletedButton}
                              onClick={() => handleGoalCompleted(goal)}
                            >
                              Ziel erreicht
                            </button>
                            <button
                              className={styles.ShowTasksButton}
                              onClick={() => {
                                setExpandedGoalIds((prev) => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(goal.id)) {
                                    newSet.delete(goal.id);
                                  } else {
                                    newSet.add(goal.id);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              Tasks anzeigen
                              <img
                                src={arrowDown}
                                alt=""
                                className={`${styles.ShowTasksArrow} ${
                                  expandedGoalIds.has(goal.id)
                                    ? styles.ShowTasksArrowUp
                                    : styles.ShowTasksArrowDown
                                }`}
                              />
                            </button>
                          </div>
                          {maxHours > 0 && (
                            <div className={styles.GoalProgressText}>
                              {timeSpent.toFixed(1)}h / {maxHours}h
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tasks für dieses Goal anzeigen */}
                    {expandedGoalIds.has(goal.id) && (
                      <div className={styles.GoalTasksList}>
                        {tasks
                          .filter(
                            (task) => task.goalId === goal.id && task.done
                          )
                          .map((task) => {
                            const taskDuration = task.taskDuration || 0;
                            const durationInHours = taskDuration / 60;
                            return (
                              <div
                                key={task.id}
                                className={styles.GoalTaskItem}
                              >
                                <div className={styles.GoalTaskText}>
                                  {task.text}
                                </div>
                                {taskDuration > 0 && (
                                  <div className={styles.GoalTaskDuration}>
                                    {durationInHours >= 1
                                      ? `${durationInHours.toFixed(1)}h`
                                      : `${taskDuration}min`}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {tasks.filter(
                          (task) => task.goalId === goal.id && task.done
                        ).length === 0 && (
                          <div className={styles.GoalTaskEmpty}>
                            An diesem Ziel wurde noch nicht gearbeitet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Done Goals List */}
        {goals.filter((goal) => goal.completed).length > 0 && (
          <div className={styles.DoneGoals}>
            <div
              className={styles.DoneGoalsHeader}
              onClick={() => setShowDoneGoals(!showDoneGoals)}
            >
              <div className={styles.DoneGoalsHeaderLeft}>
                <h3>
                  Erledigte Goals
                  <span className={styles.length}>
                    {goals.filter((goal) => goal.completed).length}
                  </span>
                </h3>
                {showDoneGoals && (
                  <button
                    className={styles.ClearAllDoneGoalsButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAllDoneGoals();
                    }}
                  >
                    Alle löschen
                  </button>
                )}
              </div>
              <img
                src={arrowDown}
                alt=""
                className={`${styles.arrow} ${
                  showDoneGoals ? styles.arrowUp : styles.arrowDown
                }`}
              />
            </div>

            {showDoneGoals && (
              <div className={styles.DoneGoalsList}>
                {goals
                  .filter((goal) => goal.completed)
                  .map((goal) => (
                    <div key={goal.id} className={styles.DoneGoalItem}>
                      <div className={styles.DoneGoalText}>{goal.text}</div>
                      {goal.completedAt && (
                        <div className={styles.DoneGoalDate}>
                          {formatDate(goal.completedAt)}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
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

      {/* Goal Reached Popup */}
      {goalReachedOpen && goalReached && (
        <div
          className={styles.deleteConfirmOverlay}
          onClick={handleGoalReachedClose}
        >
          <div
            className={styles.deleteConfirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteConfirmHeader}>
              <img
                onClick={handleGoalReachedClose}
                className={styles.deleteConfirmClose}
                src={close3}
                alt=""
              />
            </div>
            <div className={styles.deleteConfirmContent}>
              <h2 style={{ textAlign: "center" }}>
                Wurde das Ziel: {goalReached.text} erreicht?
              </h2>
            </div>
            <div className={styles.deleteConfirmActions}>
              <button
                onClick={handleGoalReachedClose}
                className={styles.deleteConfirmCancelButton}
              >
                Nein
              </button>
              <button
                onClick={() => handleGoalReachedClose(true)}
                className={styles.deleteConfirmDeleteButton}
              >
                Ja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Confirmation Popup */}
      {completeConfirmOpen && goalToComplete && (
        <div
          className={styles.deleteConfirmOverlay}
          onClick={handleCompleteCancel}
        >
          <div
            className={styles.deleteConfirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteConfirmHeader}>
              <img
                onClick={handleCompleteCancel}
                className={styles.deleteConfirmClose}
                src={close3}
                alt=""
              />
            </div>
            <div className={styles.deleteConfirmContent}>
              <h2>Ziel erreicht?</h2>
            </div>
            <div className={styles.deleteConfirmActions}>
              <button
                onClick={handleCompleteCancel}
                className={styles.deleteConfirmCancelButton}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCompleteConfirm}
                className={styles.deleteConfirmConfirmButton}
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

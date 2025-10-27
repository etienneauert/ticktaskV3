import styles from "./SingleTask.module.css";
import { useState, useEffect, useRef, useCallback } from "react";
import dot3 from "../../assets/dot-3.png";
import dot4 from "../../assets/dot-4.png";
import starWhite from "../../assets/star-white.png";
import starBlack from "../../assets/star-black.png";
import neonPlus from "../../assets/neonplus.png";
import trashBin from "../../assets/trash-bin.png";
import play from "../../assets/play.png";
import pauseBlack from "../../assets/pause-black.png";
import playBlack from "../../assets/play-black.png";
import resetBlack from "../../assets/reset-black.png";
import TaskCompletionPopup from "./TaskCompletionPopup";

export default function SingleTask({
  task,
  index,
  onDelete,
  onTaskDone,
  onEdit,
  onCopyTask,
  isDoneList = false,
  isFrequentList = false,
  runningTaskId,
  onTaskStart,
  onTaskStop,
}) {
  const text = typeof task === "string" ? task : task?.text;
  const urgent = typeof task !== "string" && task?.urgent;
  const taskDuration =
    typeof task !== "string" ? parseInt(task?.taskDuration) || 0 : 0;

  // Timer-State mit eindeutiger Task-ID
  const taskId = task?.id || `task-${index}`;

  // Edit-State
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  // Completion popup state
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const popupTimeoutRef = useRef(null);

  // Edit-Funktionen
  const handleEditStart = () => {
    if (isFrequentList) {
      setIsEditing(true);
      setEditText(text);
    }
  };

  const handleEditSave = () => {
    if (editText.trim() && onEdit) {
      onEdit(task, editText.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(text);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  // Completion popup handlers
  const handleTaskComplete = () => {
    setIsCompleted(true);
    setIsRunning(false);
    setIsPaused(false);
    setShowCompletionPopup(false);

    // Clear popup timeout
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }

    // Timer explizit stoppen
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Gespeicherten State löschen
    try {
      localStorage.removeItem(`timer_${taskId}`);
    } catch (error) {
      console.warn("Failed to clear timer state:", error);
    }

    // Task-Stop melden
    if (onTaskStop) {
      onTaskStop(taskId);
    }

    // Task als erledigt markieren
    if (onTaskDone) {
      onTaskDone(task);
    }
  };

  const handleAddTime = () => {
    // Clear popup timeout
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }

    // Füge 5 Minuten hinzu
    setTimeLeft(5 * 60);
    setShowCompletionPopup(false);
    setIsRunning(true);
    // Task-Start melden
    if (onTaskStart) {
      onTaskStart(taskId);
    }
  };

  const handleClosePopup = () => {
    // Clear popup timeout
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }

    setShowCompletionPopup(false);
    // Fallback: Timer bei 0:00 stehen lassen
    setIsCompleted(true);
  };

  // Sichere Funktion zum Laden der Timer-States
  const loadTimerState = () => {
    try {
      const stored = localStorage.getItem(`timer_${taskId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const startTime = parsed.startTime;

        // Wenn Timer läuft und nicht pausiert, berechne verbleibende Zeit basierend auf echter Zeit
        if (parsed.isRunning && !parsed.isPaused && startTime) {
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, parsed.timeLeft - elapsed);

          // Timer Recovery - berechne verbleibende Zeit basierend auf echter Zeit

          return {
            timeLeft: remaining,
            isRunning: remaining > 0,
            isCompleted: remaining === 0,
            isPaused: false,
          };
        }

        // Für pausierte oder gestoppte Timer
        return {
          timeLeft: parsed.timeLeft || taskDuration * 60,
          isRunning: false,
          isCompleted: parsed.isCompleted || false,
          isPaused: parsed.isPaused || false,
        };
      }
    } catch (error) {
      console.warn("Failed to load timer state:", error);
    }

    // Fallback zu Standardwerten
    return {
      timeLeft: taskDuration * 60,
      isRunning: false,
      isCompleted: false,
      isPaused: false,
    };
  };

  const initialState = loadTimerState();
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [isCompleted, setIsCompleted] = useState(initialState.isCompleted);
  const [isPaused, setIsPaused] = useState(initialState.isPaused);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Sichere Funktion zum Speichern der Timer-States
  const saveTimerState = useCallback(
    (state) => {
      try {
        // Lade aktuellen State um Start-Zeit zu erhalten
        const currentStored = localStorage.getItem(`timer_${taskId}`);
        let startTime = null;

        if (currentStored) {
          const currentParsed = JSON.parse(currentStored);
          startTime = currentParsed.startTime;
        }

        // Wenn Timer neu startet, setze neue Start-Zeit
        if (state.isRunning && !state.isPaused && !startTime) {
          startTime = Date.now();
        }

        const stateToSave = {
          timeLeft: state.timeLeft,
          isRunning: state.isRunning,
          isCompleted: state.isCompleted,
          isPaused: state.isPaused,
          startTime: startTime,
          lastSaved: Date.now(),
        };

        // Timer state saved
        localStorage.setItem(`timer_${taskId}`, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn("Failed to save timer state:", error);
      }
    },
    [taskId]
  );

  // Update timeLeft when taskDuration changes (only for new tasks)
  useEffect(() => {
    if (!isRunning && !isCompleted) {
      setTimeLeft(taskDuration * 60);
    }
  }, [taskDuration, isRunning, isCompleted]);

  // Timer-State speichern wenn sich etwas ändert (aber nicht beim ersten Laden)
  useEffect(() => {
    // Nur speichern wenn die Komponente bereits gemountet ist
    if (isMountedRef.current) {
      saveTimerState({ timeLeft, isRunning, isCompleted, isPaused });
    }
  }, [timeLeft, isRunning, isCompleted, isPaused, saveTimerState]);

  // Timer nur für diese spezifische Task-ID
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    };
  }, [taskId]);

  // Timer-Logik - nur wenn diese Task läuft und nicht pausiert
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0 && isMountedRef.current) {
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              setIsRunning(false);
              setIsPaused(false);
              // Zeige Completion-Popup statt direkt zu completieren
              setShowCompletionPopup(true);
              // Auto-close Popup nach 10 Sekunden als Fallback
              popupTimeoutRef.current = setTimeout(() => {
                if (showCompletionPopup) {
                  setShowCompletionPopup(false);
                  setIsCompleted(true);
                }
              }, 10000);
              // Task-Stop melden wenn Timer abgeschlossen
              if (onTaskStop) {
                onTaskStop(taskId);
              }
              return 0;
            }
            return prevTime - 1;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, taskId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = useCallback(() => {
    if (taskDuration > 0 && isMountedRef.current) {
      // Prüfe, ob bereits ein Task läuft
      if (onTaskStart && !onTaskStart(taskId)) {
        return; // Task-Start wurde blockiert
      }
      setIsRunning(true);
      setIsCompleted(false);
      setIsPaused(false);
    }
  }, [taskDuration, onTaskStart, taskId]);

  const handlePause = useCallback(() => {
    if (isMountedRef.current) {
      setIsPaused(true);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (isMountedRef.current) {
      setIsPaused(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (isMountedRef.current) {
      setIsRunning(false);
      setIsCompleted(false);
      setIsPaused(false);
      setTimeLeft(taskDuration * 60);
      // Timer explizit stoppen
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Gespeicherten State löschen
      try {
        localStorage.removeItem(`timer_${taskId}`);
      } catch (error) {
        console.warn("Failed to clear timer state:", error);
      }
      // Task-Stop melden
      if (onTaskStop) {
        onTaskStop(taskId);
      }
    }
  }, [taskDuration, taskId, onTaskStop]);

  // Wenn Task abgeschlossen ist, zeige eine vereinfachte Version
  if (task.done || isDoneList) {
    const actualTime = task.actualTimeUsed || 0;
    const plannedTime = task.plannedTime || task.taskDuration || 0;

    return (
      <div className={styles.LI}>
        <li className={styles.doneTask}>
          {!urgent && <img src={dot3} alt="" className={styles.regularIcon} />}
          {urgent && (
            <img src={starWhite} alt="" className={styles.urgentIcon} />
          )}
          <div className={styles.text}>{text}</div>
          {plannedTime > 0 && (
            <div
              className={`${styles.timeInfo} ${
                isFrequentList ? styles.frequentTimeInfo : ""
              }`}
            >
              {isFrequentList
                ? `${plannedTime}:00`
                : `${actualTime}:00 / ${plannedTime}:00`}
            </div>
          )}
          <div className={styles.taskInfo}>
            {isFrequentList && (
              <img
                className={styles.neonplus}
                onClick={() => onCopyTask?.(task)}
                src={neonPlus}
                alt="Copy Task"
                title="Add Tasks to Main list"
              />
            )}
            <img
              className={styles.delete}
              onClick={() => onDelete?.(task)}
              src={trashBin}
              alt=""
            />
          </div>
        </li>
      </div>
    );
  }

  return (
    <div className={styles.LI}>
      <li
        key={index}
        className={`${isRunning ? styles.running : ""} ${
          isFrequentList ? styles.frequent : ""
        }`}
      >
        {!urgent && (
          <img
            src={isRunning ? dot4 : dot3}
            alt=""
            className={styles.regularIcon}
          />
        )}
        {urgent && (
          <img
            src={isRunning ? starBlack : starWhite}
            alt=""
            className={styles.urgentIcon}
          />
        )}
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={handleKeyPress}
            className={styles.editInput}
            autoFocus
          />
        ) : (
          <div
            className={styles.text}
            onClick={handleEditStart}
            style={{ cursor: isFrequentList ? "pointer" : "default" }}
          >
            {text}
          </div>
        )}

        {taskDuration > 0 && !isFrequentList && (
          <div className={styles.timer}>
            {isCompleted ? (
              <div className={styles.completed}>✅ Completed!</div>
            ) : (
              <div className={styles.countdown}>{formatTime(timeLeft)}</div>
            )}
            <div className={styles.timerControls}>
              {!isRunning && !isCompleted && (
                <img
                  onClick={handleStart}
                  className={styles.goButton}
                  src={play}
                  alt=""
                />
              )}
              {isRunning && (
                <button
                  className={styles.FinishButton}
                  onClick={() => {
                    // Berechne tatsächlich verbrauchte Zeit
                    const taskDuration = parseInt(task.taskDuration) || 0;
                    const actualTimeUsed =
                      taskDuration - Math.floor(timeLeft / 60);

                    // Timer-State zurücksetzen
                    setIsRunning(false);
                    setIsCompleted(true);
                    setIsPaused(false);

                    // Timer explizit stoppen
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                      intervalRef.current = null;
                    }

                    // Gespeicherten State löschen
                    try {
                      localStorage.removeItem(`timer_${taskId}`);
                    } catch (error) {
                      console.warn("Failed to clear timer state:", error);
                    }

                    // Task-Stop melden
                    if (onTaskStop) {
                      onTaskStop(taskId);
                    }

                    onTaskDone?.(task, actualTimeUsed);
                  }}
                >
                  Done
                </button>
              )}
              {isRunning && !isPaused && (
                <img
                  onClick={handlePause}
                  className={styles.pauseButton}
                  src={pauseBlack}
                  alt=""
                />
              )}

              {isRunning && isPaused && (
                <img
                  onClick={handleResume}
                  className={styles.goButton}
                  src={playBlack}
                  alt=""
                />
              )}

              {isCompleted && (
                <img
                  button
                  onClick={handleReset}
                  className={styles.resetButton}
                  src={resetBlack}
                  alt=""
                />
              )}
            </div>
          </div>
        )}

        <div className={styles.taskInfo}>
          {!isRunning && (
            <img
              className={styles.delete}
              onClick={() => onDelete?.(task)}
              src={trashBin}
              alt=""
            />
          )}
          {isRunning && (
            <img
              className={styles.resetButton}
              onClick={handleReset}
              src={resetBlack}
              alt=""
            />
          )}
        </div>
      </li>

      <TaskCompletionPopup
        open={showCompletionPopup}
        onClose={handleClosePopup}
        onComplete={handleTaskComplete}
        onAddTime={handleAddTime}
        taskText={text}
      />
    </div>
  );
}

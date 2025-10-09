import styles from "./SingleTask.module.css";
import { useState, useEffect, useRef, useCallback } from "react";

export default function SingleTask({ task, index, onDelete }) {
  const text = typeof task === "string" ? task : task?.text;
  const urgent = typeof task !== "string" && task?.urgent;
  const taskDuration =
    typeof task !== "string" ? parseInt(task?.taskDuration) || 0 : 0;

  // Timer-State mit eindeutiger Task-ID
  const taskId = task?.id || `task-${index}`;
  const [timeLeft, setTimeLeft] = useState(() => taskDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Update timeLeft when taskDuration changes (only for new tasks)
  useEffect(() => {
    if (!isRunning && !isCompleted) {
      setTimeLeft(taskDuration * 60);
    }
  }, [taskDuration, isRunning, isCompleted]);

  // Timer nur für diese spezifische Task-ID
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
              setIsCompleted(true);
              setIsPaused(false);
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
      setIsRunning(true);
      setIsCompleted(false);
      setIsPaused(false);
    }
  }, [taskDuration]);

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
    }
  }, [taskDuration]);

  return (
    <div className={styles.LI}>
      <li key={index} className={isRunning ? styles.running : ""}>
        <div className={styles.text}>
          {text}
          {urgent ? " (dringend)" : ""}
        </div>

        {taskDuration > 0 && (
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
                  src="./src/assets/play.png"
                  alt=""
                />
              )}
              {isRunning && !isPaused && (
                <img
                  onClick={handlePause}
                  className={styles.pauseButton}
                  src="./src/assets/pause-black.png"
                  alt=""
                />
              )}
              {isRunning && isPaused && (
                <img
                  onClick={handleResume}
                  className={styles.goButton}
                  src="./src/assets/play-black.png"
                  alt=""
                />
              )}
              {isCompleted && (
                <img
                  button
                  onClick={handleReset}
                  className={styles.resetButton}
                  src="./src/assets/refresh.png"
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
              src="./src/assets/trash-bin.png"
              alt=""
            />
          )}
          {isRunning && (
            <img
              className={styles.resetButton}
              onClick={handleReset}
              src="./src/assets/reset-black.png"
              alt=""
            />
          )}
        </div>
      </li>
    </div>
  );
}

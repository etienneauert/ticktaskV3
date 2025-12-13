import { signOut } from "firebase/auth";
import {
  auth,
  db,
  startConnectionMonitoring,
  stopConnectionMonitoring,
  checkFirebaseConnection,
} from "../firebase/firebase.js";
import Header from "./TicktaskPages/Header.jsx";
import Input from "./TicktaskPages/Input.jsx";
import Main from "./TicktaskPages/Main.jsx";
import ErrorMessage from "./TicktaskPages/ErrorMessage.jsx";
import ScheduleConfirmPopup from "./TicktaskPages/ScheduleConfirmPopup.jsx";
import WelcomePopup from "./TicktaskPages/WelcomePopup.jsx";
import TutorialTooltip from "./TicktaskPages/TutorialTooltip.jsx";
import tutorialOverlayStyles from "./TicktaskPages/TutorialOverlay.module.css";
import { useGuestData } from "../hooks/useGuestData.js";
import { useEffect, useState, useRef } from "react";
import { Ring2 } from "ldrs/react";
import "ldrs/react/Ring2.css";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  increment,
} from "firebase/firestore";

const WEEK_DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const EMPTY_SCHEDULE = {
  scheduledDayOption: null,
  scheduledHour: null,
  scheduledMinute: null,
  scheduledDateTime: null,
};

const getStartOfCurrentWeek = (referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  const currentDay = date.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const resolveDateForDayOption = (dayOption) => {
  if (!dayOption) return null;
  const normalized = dayOption.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (normalized === "today") {
    return new Date(today);
  }

  if (normalized === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  const targetIndex = WEEK_DAY_ORDER.indexOf(normalized);
  if (targetIndex !== -1) {
    const weekStart = getStartOfCurrentWeek(today);
    const target = new Date(weekStart);
    target.setDate(weekStart.getDate() + targetIndex);
    return target;
  }

  return null;
};

const buildScheduledMetadata = (dayOption, hour, minute) => {
  const normalizedOption = (dayOption || "").toLowerCase();
  const hourValue =
    hour === null || hour === undefined ? "" : String(hour).padStart(2, "0");
  const minuteValue =
    minute === null || minute === undefined
      ? ""
      : String(minute).padStart(2, "0");

  if (!normalizedOption || hourValue === "" || minuteValue === "") {
    return { ...EMPTY_SCHEDULE };
  }

  const hourNum = parseInt(hourValue, 10);
  const minuteNum = parseInt(minuteValue, 10);
  if (Number.isNaN(hourNum) || Number.isNaN(minuteNum)) {
    return { ...EMPTY_SCHEDULE };
  }

  const scheduledDate = resolveDateForDayOption(normalizedOption);
  if (!scheduledDate) {
    return { ...EMPTY_SCHEDULE };
  }

  scheduledDate.setHours(hourNum, minuteNum, 0, 0);
  return {
    scheduledDayOption: normalizedOption,
    scheduledHour: hourNum,
    scheduledMinute: minuteNum,
    scheduledDateTime: scheduledDate.toISOString(),
  };
};

export function Ticktask({ user, isGuestMode = false }) {
  const isInitialLoad = useRef(true);
  const hasLoadedCompletedStates = useRef(false);
  const isUpdatingFromFirebase = useRef(false);
  // Refs für aktuelle completed states, damit onSnapshot die neuesten Werte verwendet
  const morningCompletedRef = useRef(new Set());
  const abendCompletedRef = useRef(new Set());
  const weeklyCompletedRef = useRef(new Set());
  const dailyCompletedRef = useRef(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const dataLoadedRef = useRef({
    tasks: false,
    weekly: false,
    routine: false,
  });
  const loadingStartTimeRef = useRef(null);
  const minLoadingTimeRef = useRef(null);

  // Gast-Datenmanagement
  const { guestData, updateGuestData, clearGuestData } =
    useGuestData(isGuestMode);

  // Manage weekly tasks in the main component
  const [weeklyTasks, setWeeklyTasks] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  // Manage routine tasks in the main component
  const [morningTasks, setMorningTasks] = useState([]);
  const [abendTasks, setAbendTasks] = useState([]);

  // Manage daily tasks in the main component
  const [dailyTasks, setDailyTasks] = useState([]);

  // Manage completed states for all checklist components
  const [morningCompleted, setMorningCompleted] = useState(new Set());
  const [abendCompleted, setAbendCompleted] = useState(new Set());
  const [weeklyCompleted, setWeeklyCompleted] = useState(new Set());
  const [dailyCompleted, setDailyCompleted] = useState(new Set());
  
  // Aktualisiere Refs wenn sich die States ändern
  useEffect(() => {
    morningCompletedRef.current = morningCompleted;
  }, [morningCompleted]);
  
  useEffect(() => {
    abendCompletedRef.current = abendCompleted;
  }, [abendCompleted]);
  
  useEffect(() => {
    weeklyCompletedRef.current = weeklyCompleted;
  }, [weeklyCompleted]);
  
  useEffect(() => {
    dailyCompletedRef.current = dailyCompleted;
  }, [dailyCompleted]);

  // Streak state - Initialize from localStorage or guest data
  const [streak, setStreak] = useState(() => {
    if (isGuestMode) {
      return guestData.streak || 0;
    }
    if (user?.uid) {
      try {
        const savedStreak = localStorage.getItem(`ticktask_streak_${user.uid}`);
        return savedStreak ? parseInt(savedStreak, 10) : 0;
      } catch (e) {
        console.error("Failed to load streak from localStorage", e);
        return 0;
      }
    }
    return 0;
  });

  // Gast-Modus: Verwende Gast-Daten wenn im Gast-Modus
  const currentWeeklyTasks = isGuestMode ? guestData.weeklyTasks : weeklyTasks;
  const currentMorningTasks = isGuestMode
    ? guestData.morningTasks
    : morningTasks;
  const currentAbendTasks = isGuestMode ? guestData.abendTasks : abendTasks;
  const currentDailyTasks = isGuestMode ? guestData.dailyTasks : dailyTasks;
  const currentMorningCompleted = isGuestMode
    ? guestData.morningCompleted
    : morningCompleted;
  const currentAbendCompleted = isGuestMode
    ? guestData.abendCompleted
    : abendCompleted;
  const currentWeeklyCompleted = isGuestMode
    ? guestData.weeklyCompleted
    : weeklyCompleted;
  const currentDailyCompleted = isGuestMode
    ? guestData.dailyCompleted
    : dailyCompleted;

  // Error message state
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Global running task state - always start with null
  const [runningTaskId, setRunningTaskId] = useState(null);

  // Welcome popup state
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const welcomeCheckedRef = useRef(false); // Verhindert mehrfache Prüfungen
  const guestWelcomeShownRef = useRef(false); // Verhindert mehrfache Anzeige im Guest-Mode

  // Tutorial state
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [tutorialPopupOpen, setTutorialPopupOpen] = useState(false);

  // Error handling functions
  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorMessage = () => {
    setShowError(false);
    setErrorMessage("");
  };

  // Streak management
  const canIncreaseStreak = () => {
    // Prüfe nur die aktiven Tasks (nicht Done/Frequent Tasks)
    const activeTasks = tasks.filter((task) => !task.completed);

    // Prüfe Morning Tasks nur wenn welche existieren
    let morningOk = true;
    if (morningTasks.length > 0) {
      const morningNotCompleted = morningTasks.filter(
        (task) => !currentMorningCompleted.has(task.id)
      );
      morningOk = morningNotCompleted.length === 0;
    }

    // Prüfe Abend Tasks nur wenn welche existieren
    let abendOk = true;
    if (abendTasks.length > 0) {
      const abendNotCompleted = abendTasks.filter(
        (task) => !currentAbendCompleted.has(task.id)
      );
      abendOk = abendNotCompleted.length === 0;
    }

    // Prüfe Weekly Tasks für heute nur wenn welche existieren
    const today = new Date();
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = dayNames[today.getDay()];
    const todayWeeklyTasks = currentWeeklyTasks[currentDay] || [];

    let weeklyOk = true;
    if (todayWeeklyTasks.length > 0) {
      const weeklyNotCompleted = todayWeeklyTasks.filter(
        (task) => !currentWeeklyCompleted.has(task.id)
      );
      weeklyOk = weeklyNotCompleted.length === 0;
    }

    // Prüfe Daily Tasks nur wenn welche existieren
    let dailyOk = true;
    if (currentDailyTasks.length > 0) {
      const dailyNotCompleted = currentDailyTasks.filter(
        (task) => !currentDailyCompleted.has(task.id)
      );
      dailyOk = dailyNotCompleted.length === 0;
    }

    const canIncrease =
      activeTasks.length === 0 && morningOk && abendOk && weeklyOk && dailyOk;


    return canIncrease;
  };

  // Firebase-Funktionen für Streak
  const loadStreakFromFirebase = async () => {
    if (!user?.uid || isGuestMode) return;

    try {
      const streakDoc = doc(db, "users", user.uid, "profile", "streak");
      const streakSnap = await getDoc(streakDoc);

      if (streakSnap.exists()) {
        const firebaseStreak = streakSnap.data().value || 0;
        setStreak(firebaseStreak);
        // Auch in localStorage speichern für Offline-Zugriff
        localStorage.setItem(
          `ticktask_streak_${user.uid}`,
          firebaseStreak.toString()
        );
      }
    } catch (e) {
      console.error("Failed to load streak from Firebase", e);
    }
  };

  const saveStreakToFirebase = async (streakValue) => {
    if (!user?.uid || isGuestMode) return;

    try {
      const streakDoc = doc(db, "users", user.uid, "profile", "streak");
      await setDoc(streakDoc, {
        value: streakValue,
        lastUpdated: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to save streak to Firebase", e);
    }
  };

  const increaseStreak = () => {
    // Validierung erfolgt bereits im Button, daher keine weitere Prüfung nötig
    setStreak((prevStreak) => {
      const newStreak = prevStreak + 1;

      // Im Gast-Modus: Gast-Daten aktualisieren
      if (isGuestMode) {
        updateGuestData({
          streak: newStreak,
        });
        return newStreak;
      }

      // Lokal speichern
      if (user?.uid) {
        try {
          localStorage.setItem(
            `ticktask_streak_${user.uid}`,
            newStreak.toString()
          );
        } catch (e) {
          console.error("Failed to save streak to localStorage", e);
        }

        // Auch in Firebase speichern
        saveStreakToFirebase(newStreak);
      }

      return newStreak;
    });
  };

  // Reset Streak function
  const resetStreak = () => {
    setStreak(0);

    // Im Gast-Modus: Gast-Daten aktualisieren
    if (isGuestMode) {
      updateGuestData({
        streak: 0,
      });
      return;
    }

    // Lokal speichern
    if (user?.uid) {
      try {
        localStorage.setItem(`ticktask_streak_${user.uid}`, "0");
      } catch (e) {
        console.error("Failed to reset streak in localStorage", e);
      }

      // Auch in Firebase speichern
      saveStreakToFirebase(0);
    }
  };

  // Clear all done tasks function
  const clearAllDoneTasks = () => {
    const doneTasks = tasks.filter((task) => task.done);
    doneTasks.forEach((task) => {
      handleDelete(task);
    });
  };

  // Task running management
  const handleTaskStart = (taskId) => {

    // If there's already a running task, validate if it's actually running
    if (runningTaskId && runningTaskId !== taskId) {

      // First, check if the task still exists in the list
      const currentTasks = isGuestMode ? guestData.tasks : tasks;
      const currentFrequentTemplates = isGuestMode
        ? guestData.frequentTemplates
        : frequentTemplates;
      const taskExists =
        currentTasks.some((task) => task.id === runningTaskId) ||
        currentFrequentTemplates.some((task) => task.id === runningTaskId);

      if (!taskExists) {
        setRunningTaskId(null);
        if (!isGuestMode && user?.uid) {
          localStorage.removeItem(`ticktask_running_task_${user.uid}`);
        }
        // Continue to start the new task
      } else {
        // Check if the timer is actually still running (works for both guest and logged-in users)
        try {
          const timerKey = `timer_${runningTaskId}`;
          const timerState = localStorage.getItem(timerKey);

          if (timerState) {
            const parsed = JSON.parse(timerState);
            // If timer is actually running and not paused, block the new task
            if (parsed.isRunning && !parsed.isPaused && !parsed.isCompleted) {
              showErrorMessage("Nur ein Task kann gleichzeitig laufen!");
              return false;
            } else {
              // Timer is not actually running, clear the runningTaskId and continue
              setRunningTaskId(null);
              if (!isGuestMode && user?.uid) {
                localStorage.removeItem(`ticktask_running_task_${user.uid}`);
              }
              // Continue to start the new task
            }
          } else {
            // No timer state found, clear the runningTaskId and continue
            setRunningTaskId(null);
            if (!isGuestMode && user?.uid) {
              localStorage.removeItem(`ticktask_running_task_${user.uid}`);
            }
            // Continue to start the new task
          }
        } catch (e) {
          console.error("Failed to check timer state:", e);
          // On error, clear the runningTaskId to be safe and continue
          setRunningTaskId(null);
          if (!isGuestMode && user?.uid) {
            localStorage.removeItem(`ticktask_running_task_${user.uid}`);
          }
          // Continue to start the new task
        }
      }
    }

    setRunningTaskId(taskId);
    // Save to localStorage
    if (!isGuestMode && user?.uid) {
      try {
        localStorage.setItem(
          `ticktask_running_task_${user.uid}`,
          JSON.stringify(taskId)
        );
      } catch (e) {
        console.error("Failed to save running task to localStorage", e);
      }
      
      // Speichere auch in Firebase für Synchronisation zwischen Geräten
      try {
        const runningTaskDoc = doc(db, "users", user.uid, "settings", "runningTask");
        setDoc(runningTaskDoc, {
          taskId: taskId,
          lastUpdated: serverTimestamp(),
        });
      } catch (e) {
        console.error("❌ Failed to save running task to Firebase", e);
      }
    }
    return true;
  };

  const handleTaskStop = (taskId) => {

    if (runningTaskId === taskId) {
      setRunningTaskId(null);
      // Clear from localStorage
      if (!isGuestMode && user?.uid) {
        try {
          localStorage.removeItem(`ticktask_running_task_${user.uid}`);
        } catch (e) {
          console.error("Failed to clear running task from localStorage", e);
        }
        
        // Lösche auch aus Firebase für Synchronisation zwischen Geräten
        try {
          const runningTaskDoc = doc(db, "users", user.uid, "settings", "runningTask");
          setDoc(runningTaskDoc, {
            taskId: null,
            lastUpdated: serverTimestamp(),
          });
        } catch (e) {
          console.error("❌ Failed to clear running task from Firebase", e);
        }
      }
    } else {
    }
  };

  // Force clear running task - for debugging
  const clearRunningTask = () => {
    setRunningTaskId(null);
    if (!isGuestMode && user?.uid) {
      try {
        localStorage.removeItem(`ticktask_running_task_${user.uid}`);
      } catch (e) {
        console.error(
          "Failed to force clear running task from localStorage",
          e
        );
      }
    }
  };

  const updateWeeklyTasks = async (day, tasks) => {

    // Bereinige completed Set: entferne Tasks, die für diesen Tag gelöscht wurden
    // und nicht mehr für andere Tage existieren
    let allOtherDaysTasks = new Set();
    setWeeklyTasks((prev) => {
      // Sammle alle Tasks aus allen Tagen (außer dem aktuellen Tag)
      allOtherDaysTasks = new Set();
      Object.keys(prev).forEach((d) => {
        if (d !== day && Array.isArray(prev[d])) {
          prev[d].forEach((task) => allOtherDaysTasks.add(task));
        }
      });

      const newTasks = {
        ...prev,
        [day]: tasks,
      };

      // Im Gast-Modus: Gast-Daten aktualisieren
      if (isGuestMode) {
        updateGuestData({
          weeklyTasks: newTasks,
        });
      } else {
        // Lokal speichern
        try {
          const weeklyKey = `ticktask_weekly_tasks_${user.uid}`;
          localStorage.setItem(weeklyKey, JSON.stringify(newTasks));
        } catch (e) {
          console.error("Failed to save weekly tasks locally", e);
        }
      }

      return newTasks;
    });

    // Bereinige completed Set nach dem Update
    setWeeklyCompleted((prevCompleted) => {
      const cleaned = new Set();
      prevCompleted.forEach((task) => {
        // Behalte Task nur wenn er noch für den aktuellen Tag existiert
        // oder für einen anderen Tag existiert
        if (tasks.includes(task) || allOtherDaysTasks.has(task)) {
          cleaned.add(task);
        }
      });

      // Speichere sofort in localStorage (wenn nicht im Gast-Modus)
      // Weekly completed tasks sind tagesspezifisch
      if (!isGuestMode && user?.uid) {
        try {
          const today = new Date();
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const currentDay = dayNames[today.getDay()];
          const weeklyCompletedKey = `ticktask_weekly_completed_${user.uid}_${currentDay}`;
          const cleanedArray = Array.from(cleaned);
          localStorage.setItem(
            weeklyCompletedKey,
            JSON.stringify(cleanedArray)
          );
        } catch (e) {
          console.error("Failed to save cleaned weekly completed tasks", e);
        }
      }

      return cleaned;
    });

    // Im Gast-Modus nicht zu Firebase speichern
    if (isGuestMode) {
      return;
    }

    // Zu Firebase speichern
    try {
      const weeklyCol = collection(db, "users", user.uid, "weeklyTasks");
      const dayDoc = doc(weeklyCol, day);
      await setDoc(dayDoc, {
        day: day,
        tasks: tasks,
      });
    } catch (e) {
      console.error("Failed to save weekly tasks to Firebase", e);
    }
  };

  const updateMorningTasks = async (tasks) => {
    // Bereinige completed Set ZUERST: entferne Tasks, die nicht mehr in der Liste existieren
    setMorningCompleted((prev) => {
      const cleaned = new Set();
      prev.forEach((task) => {
        if (tasks.includes(task)) {
          cleaned.add(task);
        }
      });

      // Speichere sofort in localStorage (wenn nicht im Gast-Modus)
      if (!isGuestMode && user?.uid) {
        try {
          const morningCompletedKey = `ticktask_morning_completed_${user.uid}`;
          const cleanedArray = Array.from(cleaned);
          localStorage.setItem(
            morningCompletedKey,
            JSON.stringify(cleanedArray)
          );
        } catch (e) {
          console.error("Failed to save cleaned morning completed tasks", e);
        }
      }

      return cleaned;
    });

    setMorningTasks(tasks);

    // Im Gast-Modus: Gast-Daten aktualisieren
    if (isGuestMode) {
      updateGuestData({
        morningTasks: tasks,
      });
      return;
    }

    // Lokal speichern
    try {
      const morningKey = `ticktask_morning_tasks_${user.uid}`;
      localStorage.setItem(morningKey, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save morning tasks locally", e);
    }

    // Zu Firebase speichern
    try {
      const morningCol = collection(db, "users", user.uid, "routineTasks");
      const morningDoc = doc(morningCol, "morning");
      await setDoc(morningDoc, {
        type: "morning",
        tasks: tasks,
      });
    } catch (e) {
      console.error("Failed to save morning tasks to Firebase", e);
    }
  };

  const updateAbendTasks = async (tasks) => {
    // Bereinige completed Set ZUERST: entferne Tasks, die nicht mehr in der Liste existieren
    setAbendCompleted((prev) => {
      const cleaned = new Set();
      prev.forEach((task) => {
        if (tasks.includes(task)) {
          cleaned.add(task);
        }
      });

      // Speichere sofort in localStorage (wenn nicht im Gast-Modus)
      if (!isGuestMode && user?.uid) {
        try {
          const abendCompletedKey = `ticktask_abend_completed_${user.uid}`;
          const cleanedArray = Array.from(cleaned);
          localStorage.setItem(abendCompletedKey, JSON.stringify(cleanedArray));
        } catch (e) {
          console.error("Failed to save cleaned abend completed tasks", e);
        }
      }

      return cleaned;
    });

    setAbendTasks(tasks);

    // Im Gast-Modus: Gast-Daten aktualisieren
    if (isGuestMode) {
      updateGuestData({
        abendTasks: tasks,
      });
      return;
    }

    // Lokal speichern
    try {
      const abendKey = `ticktask_abend_tasks_${user.uid}`;
      localStorage.setItem(abendKey, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save abend tasks locally", e);
    }

    // Zu Firebase speichern
    try {
      const abendCol = collection(db, "users", user.uid, "routineTasks");
      const abendDoc = doc(abendCol, "abend");
      await setDoc(abendDoc, {
        type: "abend",
        tasks: tasks,
      });
    } catch (e) {
      console.error("Failed to save abend tasks to Firebase", e);
    }
  };

  const updateDailyTasks = async (tasks) => {
    // Bereinige completed Set ZUERST: entferne Tasks, die nicht mehr in der Liste existieren
    setDailyCompleted((prev) => {
      const cleaned = new Set();
      prev.forEach((task) => {
        if (tasks.includes(task)) {
          cleaned.add(task);
        }
      });

      // Speichere sofort in localStorage (wenn nicht im Gast-Modus)
      if (!isGuestMode && user?.uid) {
        try {
          const dailyCompletedKey = `ticktask_daily_completed_${user.uid}`;
          const cleanedArray = Array.from(cleaned);
          localStorage.setItem(dailyCompletedKey, JSON.stringify(cleanedArray));
        } catch (e) {
          console.error("Failed to save cleaned daily completed tasks", e);
        }
      }

      return cleaned;
    });

    setDailyTasks(tasks);

    // Im Gast-Modus: Gast-Daten aktualisieren
    if (isGuestMode) {
      updateGuestData({
        dailyTasks: tasks,
      });
      return;
    }

    // Lokal speichern
    try {
      const dailyKey = `ticktask_daily_tasks_${user.uid}`;
      localStorage.setItem(dailyKey, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save daily tasks locally", e);
    }

    // Zu Firebase speichern
    try {
      const dailyCol = collection(db, "users", user.uid, "routineTasks");
      const dailyDoc = doc(dailyCol, "daily");
      await setDoc(dailyDoc, {
        type: "daily",
        tasks: tasks,
      });
    } catch (e) {
      console.error("Failed to save daily tasks to Firebase", e);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleAdd = async (task) => {
    if (!user?.uid && !isGuestMode) return;
    const scheduleMeta = buildScheduledMetadata(
      task.scheduledDayOption,
      task.scheduledHour,
      task.scheduledMinute
    );

    // Im Gast-Modus: Gast-Daten aktualisieren
    if (isGuestMode) {
      const newTask = {
        id: `local-${Date.now()}`,
        text: task.text,
        urgent: !!task.urgent,
        done: false,
        taskDuration: parseInt(task.taskDuration) || 0,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        frequent: !!task.frequent,
        goalId: task.goalId || null,
        ...scheduleMeta,
      };

      // Verwende setGuestData direkt für sofortige State-Aktualisierung
      const updatedTasks = [...(guestData.tasks || []), newTask];

      updateGuestData({
        tasks: updatedTasks,
      });

      // Prüfe localStorage nach dem Update
      setTimeout(() => {
        const saved = localStorage.getItem("ticktask_guest_data");
        if (saved) {
          const parsed = JSON.parse(saved);
        }
      }, 100);

      return;
    }

    // Für angemeldete Benutzer: Direkt zu Firebase schreiben für Echtzeit-Sync
    try {
      const tasksCol = collection(db, "users", user.uid, "tasks");
      const docRef = await addDoc(tasksCol, {
        text: task.text,
        urgent: !!task.urgent,
        done: false,
        taskDuration: parseInt(task.taskDuration) || 0,
        createdAt: serverTimestamp(),
        frequent: !!task.frequent,
        goalId: task.goalId || null,
        ...scheduleMeta,
      });
    } catch (e) {
      console.error("❌ Failed to add task to Firestore", e);
      // Fallback: Lokal speichern wenn Firebase fehlschlägt
      const newTask = {
        id: `local-${Date.now()}`,
        text: task.text,
        urgent: !!task.urgent,
        done: false,
        taskDuration: parseInt(task.taskDuration) || 0,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        frequent: !!task.frequent,
        goalId: task.goalId || null,
        ...scheduleMeta,
      };
      setTasks((prev) => [...prev, newTask]);
    }
  };

  const handleDelete = async (taskToDelete) => {
    if (!user?.uid && !isGuestMode) return;

    // Im Gast-Modus: Gast-Daten aktualisieren
    if (isGuestMode) {
      const updatedTasks = guestData.tasks.filter(
        (task) => task.id !== taskToDelete.id
      );
      updateGuestData({ tasks: updatedTasks });
      return;
    }

    // Für angemeldete Benutzer: Direkt aus Firebase löschen für Echtzeit-Sync
    if (taskToDelete.id && !taskToDelete.id.startsWith("local-")) {
      try {
        const taskDoc = doc(db, "users", user.uid, "tasks", taskToDelete.id);
        await deleteDoc(taskDoc);
      } catch (e) {
        console.error("❌ Failed to delete from Firestore", e);
        // Fallback: Lokal entfernen
        setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id));
      }
    } else {
      // Lokale Tasks direkt entfernen
      setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id));
    }

    // Wenn Task frequent ist, erstelle ein Template
    if (taskToDelete.frequent) {
      const template = {
        id: `template-${Date.now()}`,
        text: taskToDelete.text,
        urgent: taskToDelete.urgent,
        taskDuration: taskToDelete.taskDuration,
        frequent: true,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
      };

      setFrequentTemplates((prev) => {
        const updated = [...prev, template];
        // Lokal speichern
        try {
          const templatesKey = `ticktask_frequent_templates_${user.uid}`;
          localStorage.setItem(templatesKey, JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save frequent templates locally", e);
        }
        return updated;
      });
    }
  };

  const handleTaskDone = async (taskToComplete, actualTimeUsed = null) => {
    if (!user?.uid && !isGuestMode) return;

    // Berechne tatsächlich verbrauchte Zeit
    const taskDuration = parseInt(taskToComplete.taskDuration) || 0;
    const actualTime = actualTimeUsed || taskDuration;

    // Im Gast-Modus: Gast-Daten aktualisieren
    if (isGuestMode) {
      const updatedTasks = guestData.tasks.map((task) =>
        task.id === taskToComplete.id
          ? {
              ...task,
              done: true,
              completedAt: { seconds: Math.floor(Date.now() / 1000) },
              actualTimeUsed: actualTime,
              plannedTime: taskDuration,
            }
          : task
      );

      // Wenn der Task ein Goal hat, füge die Zeit zum Goal hinzu
      // Verwende taskDuration (geplante Zeit) wie im normalen Modus, nicht actualTime
      if (taskToComplete.goalId && taskDuration > 0) {
        updateGuestData((prevData) => {
          const updatedGoals = (prevData.goals || []).map((goal) => {
            if (goal.id === taskToComplete.goalId) {
              const currentTimeSpent = goal.timeSpent || 0;
              const newTimeSpent = currentTimeSpent + taskDuration; // taskDuration ist in Minuten
              return {
                ...goal,
                timeSpent: newTimeSpent,
              };
            }
            return goal;
          });
          return {
            ...prevData,
            tasks: updatedTasks,
            goals: updatedGoals,
          };
        });
        // Dispatch Event für automatische Aktualisierung
        window.dispatchEvent(
          new CustomEvent("goalsChanged", {
            detail: { action: "timeSpentUpdated" },
          })
        );
      } else {
        updateGuestData({ tasks: updatedTasks });
      }
      return;
    }

    // Für angemeldete Benutzer: Direkt zu Firebase schreiben für Echtzeit-Sync
    if (taskToComplete.id && !taskToComplete.id.startsWith("local-")) {
      try {
        const taskDoc = doc(db, "users", user.uid, "tasks", taskToComplete.id);
        const updateData = {
          done: true,
          completedAt: serverTimestamp(),
          actualTimeUsed: actualTime,
          plannedTime: taskDuration,
        };
        // Behalte goalId wenn es bereits existiert
        if (taskToComplete.goalId) {
          updateData.goalId = taskToComplete.goalId;
        }
        await updateDoc(taskDoc, updateData);

        // Wenn der Task ein Goal hat, füge die Zeit zum Goal hinzu
        if (taskToComplete.goalId && taskDuration > 0) {
          try {
            const goalDoc = doc(
              db,
              "users",
              user.uid,
              "goals",
              taskToComplete.goalId
            );
            await updateDoc(goalDoc, {
              timeSpent: increment(taskDuration), // taskDuration ist in Minuten
            });
          } catch (e) {
            console.error("❌ Failed to update goal time", e);
          }
        }
      } catch (e) {
        console.error("❌ Failed to update task in Firestore", e);
        // Fallback: Lokal aktualisieren
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskToComplete.id
              ? {
                  ...task,
                  done: true,
                  completedAt: { seconds: Math.floor(Date.now() / 1000) },
                  actualTimeUsed: actualTime,
                  plannedTime: taskDuration,
                  goalId: task.goalId || taskToComplete.goalId || null,
                }
              : task
          )
        );
      }
    }
  };

  const handleCopyTask = async (taskToCopyParam) => {
    if (!user?.uid) return;

    // Zeige zuerst das Bestätigungs-Popup
    setTaskToCopy(taskToCopyParam);
    setScheduleConfirmOpen(true);
  };

  const handleScheduleConfirm = async (shouldSchedule, scheduleData) => {
    if (!user?.uid || !taskToCopy) return;

    setScheduleConfirmOpen(false);

    if (shouldSchedule && scheduleData) {
      // Füge Task mit Schedule hinzu
      await addCopiedTask(
        taskToCopy,
        scheduleData.scheduledDayOption,
        scheduleData.scheduledHour,
        scheduleData.scheduledMinute,
        null
      );
    } else {
      // Füge Task ohne Schedule hinzu
      await addCopiedTask(taskToCopy, null, null, null, null);
    }
    setTaskToCopy(null);
  };

  const handleScheduleCancel = () => {
    setScheduleConfirmOpen(false);
    setTaskToCopy(null);
  };

  const addCopiedTask = async (
    taskToCopyParam,
    scheduledDayOption,
    scheduledHour,
    scheduledMinute,
    scheduledDateTime
  ) => {
    if (!user?.uid) return;

    // Berechne scheduledDateTime falls Tag und Uhrzeit angegeben sind
    let finalScheduledDateTime = scheduledDateTime;
    if (
      scheduledDayOption &&
      scheduledHour !== null &&
      scheduledMinute !== null
    ) {
      const today = new Date();
      const currentDay = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
      monday.setHours(0, 0, 0, 0);

      const dayMap = {
        monday: 0,
        tuesday: 1,
        wednesday: 2,
        thursday: 3,
        friday: 4,
        saturday: 5,
        sunday: 6,
      };
      const dayIndex = dayMap[scheduledDayOption];
      if (dayIndex !== undefined) {
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + dayIndex);
        targetDate.setHours(
          parseInt(scheduledHour) || 0,
          parseInt(scheduledMinute) || 0,
          0,
          0
        );
        finalScheduledDateTime = targetDate.toISOString();
      }
    }

    // Erstelle eine Kopie des Tasks mit neuer ID
    const copiedTask = {
      id: `local-${Date.now()}`, // Neue lokale ID
      text: taskToCopyParam.text,
      urgent: taskToCopyParam.urgent || false,
      done: false, // Als nicht abgeschlossen markieren
      taskDuration: parseInt(taskToCopyParam.taskDuration) || 0,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      // Entferne alte Zeit-Daten
      actualTimeUsed: undefined,
      plannedTime: undefined,
      completedAt: undefined,
      scheduledDayOption: scheduledDayOption,
      scheduledHour: scheduledHour,
      scheduledMinute: scheduledMinute,
      scheduledDateTime: finalScheduledDateTime,
    };

    // Sofort lokal hinzufügen
    setTasks((prev) => [...prev, copiedTask]);

    // Lokal speichern
    try {
      const cacheKey = `ticktask_tasks_${user.uid}`;
      const updated = [...tasks, copiedTask];
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save locally", e);
    }

    // Im Hintergrund zu Firestore hinzufügen
    try {
      const tasksCol = collection(db, "users", user.uid, "tasks");
      await addDoc(tasksCol, {
        text: copiedTask.text,
        urgent: copiedTask.urgent,
        done: copiedTask.done,
        taskDuration: copiedTask.taskDuration,
        createdAt: serverTimestamp(),
        scheduledDayOption: copiedTask.scheduledDayOption,
        scheduledHour: copiedTask.scheduledHour,
        scheduledMinute: copiedTask.scheduledMinute,
        scheduledDateTime: copiedTask.scheduledDateTime,
      });
    } catch (e) {
      console.error("Failed to add copied task to Firestore", e);
    }
  };

  const handleFrequentDelete = async (taskToDelete) => {
    if (!user?.uid) return;

    // Prüfe ob es ein Template ist
    if (taskToDelete.id.startsWith("template-")) {
      // Template aus frequentTemplates entfernen
      setFrequentTemplates((prev) => {
        const updated = prev.filter(
          (template) => template.id !== taskToDelete.id
        );
        // Lokal speichern
        try {
          const templatesKey = `ticktask_frequent_templates_${user.uid}`;
          localStorage.setItem(templatesKey, JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save frequent templates locally", e);
        }
        return updated;
      });
      return;
    }

    // Normale frequent task: nur frequent-Flag entfernen
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskToDelete.id ? { ...task, frequent: false } : task
      )
    );

    // Lokal speichern
    try {
      const cacheKey = `ticktask_tasks_${user.uid}`;
      const updatedTasks = tasks.map((task) =>
        task.id === taskToDelete.id ? { ...task, frequent: false } : task
      );
      localStorage.setItem(cacheKey, JSON.stringify(updatedTasks));
    } catch (e) {
      console.error("Failed to save locally", e);
    }

    // In Firestore frequent-Flag entfernen (nur wenn es eine echte Firestore-ID hat)
    if (taskToDelete.id && !taskToDelete.id.startsWith("local-")) {
      try {
        const taskDoc = doc(db, "users", user.uid, "tasks", taskToDelete.id);
        await updateDoc(taskDoc, {
          frequent: false,
        });
      } catch (e) {
        console.error("Failed to update task in Firestore", e);
      }
    }
  };

  const handleEdit = async (taskToEdit, newText) => {
    if (!user?.uid) return;

    // Sofort lokal aktualisieren
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskToEdit.id ? { ...task, text: newText } : task
      )
    );

    // Lokal speichern
    try {
      const cacheKey = `ticktask_tasks_${user.uid}`;
      const updatedTasks = tasks.map((task) =>
        task.id === taskToEdit.id ? { ...task, text: newText } : task
      );
      localStorage.setItem(cacheKey, JSON.stringify(updatedTasks));
    } catch (e) {
      console.error("Failed to save locally", e);
    }

    // In Firestore aktualisieren (nur wenn es eine echte Firestore-ID hat)
    if (taskToEdit.id && !taskToEdit.id.startsWith("local-")) {
      try {
        const taskDoc = doc(db, "users", user.uid, "tasks", taskToEdit.id);
        await updateDoc(taskDoc, {
          text: newText,
        });
      } catch (e) {
        console.error("Failed to update task in Firestore", e);
      }
    }
  };

  const [tasks, setTasks] = useState([]);
  const [frequentTemplates, setFrequentTemplates] = useState([]);
  const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false);
  const [taskToCopy, setTaskToCopy] = useState(null);

  // Funktion zum Prüfen, ob alle Daten geladen wurden
  const checkIfAllDataLoaded = () => {
    if (
      dataLoadedRef.current.tasks &&
      dataLoadedRef.current.weekly &&
      dataLoadedRef.current.routine
    ) {
      // Prüfe, ob mindestens 1.5 Sekunden vergangen sind
      const elapsed = Date.now() - loadingStartTimeRef.current;
      const minLoadingTime = 1500; // 1.5 Sekunden

      if (elapsed >= minLoadingTime) {
        // Mindestzeit erreicht, sofort ausblenden
        setIsLoading(false);
      } else {
        // Mindestzeit noch nicht erreicht, Timer setzen
        const remainingTime = minLoadingTime - elapsed;
        if (minLoadingTimeRef.current) {
          clearTimeout(minLoadingTimeRef.current);
        }
        minLoadingTimeRef.current = setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    }
  };

  // Lade Tasks beim Start
  useEffect(() => {
    // Reset loading state
    setIsLoading(true);
    loadingStartTimeRef.current = Date.now();
    if (minLoadingTimeRef.current) {
      clearTimeout(minLoadingTimeRef.current);
    }
    dataLoadedRef.current = {
      tasks: false,
      weekly: false,
      routine: false,
    };
    // Firebase Verbindungsüberwachung starten (nur für angemeldete Benutzer)
    if (user?.uid && !isGuestMode) {
      startConnectionMonitoring();

      // Streak aus Firebase laden
      loadStreakFromFirebase();
    }

    if (!user?.uid && !isGuestMode) {
      setTasks([]);
      setFrequentTemplates([]);
      setIsLoading(false);
      return;
    }

    // Im Gast-Modus leere Listen setzen
    if (isGuestMode) {
      setTasks([]);
      setFrequentTemplates([]);
      setIsLoading(false);
      return;
    }

    // Check if there's a running task and validate it
    if (!isGuestMode && user?.uid) {
      // Lade runningTaskId aus Firebase (hat Priorität über localStorage)
      const loadRunningTaskFromFirebase = async () => {
        try {
          const runningTaskDoc = doc(db, "users", user.uid, "settings", "runningTask");
          const docSnap = await getDoc(runningTaskDoc);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const firebaseRunningTaskId = data.taskId || null;
            
            if (firebaseRunningTaskId) {
              
              // Check if timer is actually still running
              const timerKey = `timer_${firebaseRunningTaskId}`;
              const timerState = localStorage.getItem(timerKey);

              if (timerState) {
                const parsed = JSON.parse(timerState);
                if (parsed.isRunning && !parsed.isCompleted) {
                  setRunningTaskId(firebaseRunningTaskId);
                  localStorage.setItem(
                    `ticktask_running_task_${user.uid}`,
                    JSON.stringify(firebaseRunningTaskId)
                  );
                } else {
                  setRunningTaskId(null);
                  localStorage.removeItem(`ticktask_running_task_${user.uid}`);
                  // Lösche auch aus Firebase
                  await setDoc(runningTaskDoc, {
                    taskId: null,
                    lastUpdated: serverTimestamp(),
                  });
                }
              } else {
                setRunningTaskId(null);
                localStorage.removeItem(`ticktask_running_task_${user.uid}`);
                // Lösche auch aus Firebase
                await setDoc(runningTaskDoc, {
                  taskId: null,
                  lastUpdated: serverTimestamp(),
                });
              }
            } else {
              // Kein running task in Firebase, lösche auch localStorage
              setRunningTaskId(null);
              localStorage.removeItem(`ticktask_running_task_${user.uid}`);
            }
          } else {
            // Kein Dokument in Firebase, lösche localStorage falls vorhanden
            setRunningTaskId(null);
            localStorage.removeItem(`ticktask_running_task_${user.uid}`);
          }
        } catch (e) {
          console.error("Failed to load running task from Firebase", e);
          // Fallback: Versuche aus localStorage zu laden
          try {
            const stored = localStorage.getItem(
              `ticktask_running_task_${user.uid}`
            );
            if (stored) {
              const runningTaskId = JSON.parse(stored);
              setRunningTaskId(runningTaskId);
            }
          } catch (e2) {
            console.error("Failed to load running task from localStorage", e2);
            setRunningTaskId(null);
          }
        }
      };
      
      loadRunningTaskFromFirebase();
    }

    // Lokale Tasks laden
    try {
      const cacheKey = `ticktask_tasks_${user.uid}`;
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to read local cache", e);
    }

    // Lokale Frequent Templates laden
    try {
      const templatesKey = `ticktask_frequent_templates_${user.uid}`;
      const templatesRaw = localStorage.getItem(templatesKey);
      if (templatesRaw) {
        const templatesParsed = JSON.parse(templatesRaw);
        if (Array.isArray(templatesParsed)) {
          setFrequentTemplates(templatesParsed);
        }
      }
    } catch (e) {
      console.error("Failed to read frequent templates cache", e);
    }

    // Lokale Weekly Tasks laden
    try {
      const weeklyKey = `ticktask_weekly_tasks_${user.uid}`;
      const weeklyRaw = localStorage.getItem(weeklyKey);
      if (weeklyRaw) {
        const weeklyParsed = JSON.parse(weeklyRaw);
        if (weeklyParsed && typeof weeklyParsed === "object") {
          setWeeklyTasks(weeklyParsed);
        }
      }
    } catch (e) {
      console.error("Failed to read weekly tasks cache", e);
    }

    // Firebase Weekly Tasks abonnieren
    const weeklyCol = collection(db, "users", user.uid, "weeklyTasks");
    const unsubscribeWeekly = onSnapshot(
      weeklyCol,
      (snapshot) => {
        const serverWeeklyTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        dataLoadedRef.current.weekly = true;
        checkIfAllDataLoaded();

        if (serverWeeklyTasks.length > 0) {
          // Konvertiere Firebase-Daten zu unserem Format
          const weeklyData = {
            monday:
              serverWeeklyTasks.find((task) => task.day === "monday")?.tasks ||
              [],
            tuesday:
              serverWeeklyTasks.find((task) => task.day === "tuesday")?.tasks ||
              [],
            wednesday:
              serverWeeklyTasks.find((task) => task.day === "wednesday")
                ?.tasks || [],
            thursday:
              serverWeeklyTasks.find((task) => task.day === "thursday")
                ?.tasks || [],
            friday:
              serverWeeklyTasks.find((task) => task.day === "friday")?.tasks ||
              [],
            saturday:
              serverWeeklyTasks.find((task) => task.day === "saturday")
                ?.tasks || [],
            sunday:
              serverWeeklyTasks.find((task) => task.day === "sunday")?.tasks ||
              [],
          };

          // Direkte Synchronisation mit Firebase-Daten für Echtzeit-Sync
          setWeeklyTasks(weeklyData);

          // Speichere Firebase-Daten in localStorage für Offline-Zugriff
          try {
            localStorage.setItem(
              `ticktask_weekly_tasks_${user.uid}`,
              JSON.stringify(weeklyData)
            );
          } catch (e) {
            console.error(
              "Failed to save Firebase weekly tasks to localStorage",
              e
            );
          }
        } else {
        }
      },
      (error) => {
        console.error("Failed to subscribe weekly tasks", error);
      }
    );

    // Lokale Morning Tasks laden
    try {
      const morningKey = `ticktask_morning_tasks_${user.uid}`;
      const morningRaw = localStorage.getItem(morningKey);
      if (morningRaw) {
        const morningParsed = JSON.parse(morningRaw);
        if (Array.isArray(morningParsed)) {
          setMorningTasks(morningParsed);
        }
      }
    } catch (e) {
      console.error("Failed to read morning tasks cache", e);
    }

    // Lokale Abend Tasks laden
    try {
      const abendKey = `ticktask_abend_tasks_${user.uid}`;
      const abendRaw = localStorage.getItem(abendKey);
      if (abendRaw) {
        const abendParsed = JSON.parse(abendRaw);
        if (Array.isArray(abendParsed)) {
          setAbendTasks(abendParsed);
        }
      }
    } catch (e) {
      console.error("Failed to read abend tasks cache", e);
    }

    // Lokale Daily Tasks laden
    try {
      const dailyKey = `ticktask_daily_tasks_${user.uid}`;
      const dailyRaw = localStorage.getItem(dailyKey);
      if (dailyRaw) {
        const dailyParsed = JSON.parse(dailyRaw);
        if (Array.isArray(dailyParsed)) {
          setDailyTasks(dailyParsed);
        }
      }
    } catch (e) {
      console.error("Failed to read daily tasks cache", e);
    }

    // Completed states aus localStorage laden (nur einmal beim Start)
    if (user?.uid && !isGuestMode) {
      try {
        const morningCompletedKey = `ticktask_morning_completed_${user.uid}`;
        const morningCompletedRaw = localStorage.getItem(morningCompletedKey);
        if (morningCompletedRaw) {
          const morningCompletedArray = JSON.parse(morningCompletedRaw);
          if (Array.isArray(morningCompletedArray)) {
            setMorningCompleted(new Set(morningCompletedArray));
          }
        }
      } catch (e) {
        console.error("Failed to load morning completed tasks", e);
      }

      try {
        const abendCompletedKey = `ticktask_abend_completed_${user.uid}`;
        const abendCompletedRaw = localStorage.getItem(abendCompletedKey);
        if (abendCompletedRaw) {
          const abendCompletedArray = JSON.parse(abendCompletedRaw);
          if (Array.isArray(abendCompletedArray)) {
            setAbendCompleted(new Set(abendCompletedArray));
          }
        }
      } catch (e) {
        console.error("Failed to load abend completed tasks", e);
      }

      try {
        const today = new Date();
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const currentDay = dayNames[today.getDay()];
        const weeklyCompletedKey = `ticktask_weekly_completed_${user.uid}_${currentDay}`;
        const weeklyCompletedRaw = localStorage.getItem(weeklyCompletedKey);
        if (weeklyCompletedRaw) {
          const weeklyCompletedArray = JSON.parse(weeklyCompletedRaw);
          if (Array.isArray(weeklyCompletedArray)) {
            setWeeklyCompleted(new Set(weeklyCompletedArray));
          }
        }
      } catch (e) {
        console.error("Failed to load weekly completed tasks", e);
      }

      try {
        const dailyCompletedKey = `ticktask_daily_completed_${user.uid}`;
        const dailyCompletedRaw = localStorage.getItem(dailyCompletedKey);
        if (dailyCompletedRaw) {
          const dailyCompletedArray = JSON.parse(dailyCompletedRaw);
          if (Array.isArray(dailyCompletedArray)) {
            setDailyCompleted(new Set(dailyCompletedArray));
          }
        }
      } catch (e) {
        console.error("Failed to load daily completed tasks", e);
      }

      // Lade completed-Tasks auch aus Firebase (falls vorhanden, überschreibt localStorage)
      const loadCompletedTasksFromFirebase = async () => {
        try {
          const today = new Date();
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const currentDay = dayNames[today.getDay()];

          // Morning completed
          const morningCompletedDoc = await getDoc(
            doc(db, "users", user.uid, "completedTasks", "morning")
          );
          if (morningCompletedDoc.exists()) {
            const data = morningCompletedDoc.data();
            if (Array.isArray(data.tasks)) {
              isUpdatingFromFirebase.current = true;
              setMorningCompleted(new Set(data.tasks));
              localStorage.setItem(
                `ticktask_morning_completed_${user.uid}`,
                JSON.stringify(data.tasks)
              );
              setTimeout(() => {
                isUpdatingFromFirebase.current = false;
              }, 100);
            }
          }

          // Abend completed
          const abendCompletedDoc = await getDoc(
            doc(db, "users", user.uid, "completedTasks", "abend")
          );
          if (abendCompletedDoc.exists()) {
            const data = abendCompletedDoc.data();
            if (Array.isArray(data.tasks)) {
              isUpdatingFromFirebase.current = true;
              setAbendCompleted(new Set(data.tasks));
              localStorage.setItem(
                `ticktask_abend_completed_${user.uid}`,
                JSON.stringify(data.tasks)
              );
              setTimeout(() => {
                isUpdatingFromFirebase.current = false;
              }, 100);
            }
          }

          // Weekly completed
          const weeklyCompletedDoc = await getDoc(
            doc(db, "users", user.uid, "completedTasks", `weekly_${currentDay}`)
          );
          if (weeklyCompletedDoc.exists()) {
            const data = weeklyCompletedDoc.data();
            if (Array.isArray(data.tasks)) {
              isUpdatingFromFirebase.current = true;
              setWeeklyCompleted(new Set(data.tasks));
              localStorage.setItem(
                `ticktask_weekly_completed_${user.uid}_${currentDay}`,
                JSON.stringify(data.tasks)
              );
              setTimeout(() => {
                isUpdatingFromFirebase.current = false;
              }, 100);
            }
          }

          // Daily completed
          const dailyCompletedDoc = await getDoc(
            doc(db, "users", user.uid, "completedTasks", "daily")
          );
          if (dailyCompletedDoc.exists()) {
            const data = dailyCompletedDoc.data();
            if (Array.isArray(data.tasks)) {
              isUpdatingFromFirebase.current = true;
              setDailyCompleted(new Set(data.tasks));
              localStorage.setItem(
                `ticktask_daily_completed_${user.uid}`,
                JSON.stringify(data.tasks)
              );
              setTimeout(() => {
                isUpdatingFromFirebase.current = false;
              }, 100);
            }
          }
        } catch (e) {
          console.error("Failed to load completed tasks from Firebase", e);
        }
      };

      loadCompletedTasksFromFirebase();

      // Markiere dass States geladen wurden (nach kurzer Verzögerung, damit setState durch ist)
      setTimeout(() => {
        hasLoadedCompletedStates.current = true;
      }, 200);
    } else {
      // Im Gast-Modus oder ohne User: Markiere sofort als geladen
      hasLoadedCompletedStates.current = true;
    }

    // Firebase Routine Tasks abonnieren
    const routineCol = collection(db, "users", user.uid, "routineTasks");
    const unsubscribeRoutine = onSnapshot(
      routineCol,
      (snapshot) => {
        const serverRoutineTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        dataLoadedRef.current.routine = true;
        checkIfAllDataLoaded();

        // Morning Tasks aus Firebase laden
        const morningTask = serverRoutineTasks.find(
          (task) => task.type === "morning"
        );
        if (morningTask && Array.isArray(morningTask.tasks)) {
          setMorningTasks(morningTask.tasks);
          // Auch in localStorage speichern für Offline-Zugriff
          try {
            localStorage.setItem(
              `ticktask_morning_tasks_${user.uid}`,
              JSON.stringify(morningTask.tasks)
            );
          } catch (e) {
            console.error("Failed to save morning tasks to localStorage", e);
          }
        }

        // Abend Tasks aus Firebase laden
        const abendTask = serverRoutineTasks.find(
          (task) => task.type === "abend"
        );
        if (abendTask && Array.isArray(abendTask.tasks)) {
          setAbendTasks(abendTask.tasks);
          // Auch in localStorage speichern für Offline-Zugriff
          try {
            localStorage.setItem(
              `ticktask_abend_tasks_${user.uid}`,
              JSON.stringify(abendTask.tasks)
            );
          } catch (e) {
            console.error("Failed to save abend tasks to localStorage", e);
          }
        }

        // Daily Tasks aus Firebase laden
        const dailyTask = serverRoutineTasks.find(
          (task) => task.type === "daily"
        );
        if (dailyTask && Array.isArray(dailyTask.tasks)) {
          setDailyTasks(dailyTask.tasks);
          // Auch in localStorage speichern für Offline-Zugriff
          try {
            localStorage.setItem(
              `ticktask_daily_tasks_${user.uid}`,
              JSON.stringify(dailyTask.tasks)
            );
          } catch (e) {
            console.error("Failed to save daily tasks to localStorage", e);
          }
        }
      },
      (error) => {
        console.error("Failed to subscribe routine tasks", error);
      }
    );

    // Completed-States werden innerhalb der jeweiligen Checklisten gespeichert/geladen

    // Firestore im Hintergrund abonnieren für Echtzeit-Synchronisation
    const tasksCol = collection(db, "users", user.uid, "tasks");
    const unsubscribe = onSnapshot(
      tasksCol,
      (snapshot) => {
        const serverTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Direkte Synchronisation mit Firebase für Echtzeit-Sync zwischen Geräten
        setTasks(serverTasks);
        dataLoadedRef.current.tasks = true;
        checkIfAllDataLoaded();

        // Speichere Firebase-Daten in localStorage für Offline-Zugriff
        try {
          localStorage.setItem(
            `ticktask_tasks_${user.uid}`,
            JSON.stringify(serverTasks)
          );
        } catch (e) {
          console.error("Failed to save Firebase tasks to localStorage", e);
        }
      },
      (error) => {
        console.error("❌ Failed to subscribe tasks", error);
      }
    );

    // Firebase Completed Tasks abonnieren für Echtzeit-Synchronisation
    if (user?.uid && !isGuestMode) {
      const completedCol = collection(db, "users", user.uid, "completedTasks");
      const unsubscribeCompleted = onSnapshot(
        completedCol,
        (snapshot) => {
          
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;

            if (Array.isArray(data.tasks)) {
              // Prüfe ob sich die Daten wirklich geändert haben
              // WICHTIG: Nur updaten wenn wir nicht gerade selbst speichern
              if (isUpdatingFromFirebase.current) {
                return;
              }
              
              let hasChanged = false;
              let currentSet = new Set();
              
              if (docId === "morning") {
                currentSet = morningCompletedRef.current;
                const newSet = new Set(data.tasks);
                hasChanged = currentSet.size !== newSet.size || 
                  Array.from(currentSet).some(item => !newSet.has(item)) ||
                  Array.from(newSet).some(item => !currentSet.has(item));
                
                
                if (hasChanged) {
                  isUpdatingFromFirebase.current = true;
                  setMorningCompleted(newSet);
                  morningCompletedRef.current = newSet;
                  localStorage.setItem(
                    `ticktask_morning_completed_${user.uid}`,
                    JSON.stringify(data.tasks)
                  );
                  setTimeout(() => {
                    isUpdatingFromFirebase.current = false;
                  }, 500);
                } else {
                }
              } else if (docId === "abend") {
                currentSet = abendCompletedRef.current;
                const newSet = new Set(data.tasks);
                hasChanged = currentSet.size !== newSet.size || 
                  Array.from(currentSet).some(item => !newSet.has(item)) ||
                  Array.from(newSet).some(item => !currentSet.has(item));
                
                if (hasChanged) {
                  isUpdatingFromFirebase.current = true;
                  setAbendCompleted(newSet);
                  abendCompletedRef.current = newSet;
                  localStorage.setItem(
                    `ticktask_abend_completed_${user.uid}`,
                    JSON.stringify(data.tasks)
                  );
                  setTimeout(() => {
                    isUpdatingFromFirebase.current = false;
                  }, 500);
                }
              } else if (docId === "daily") {
                currentSet = dailyCompletedRef.current;
                const newSet = new Set(data.tasks);
                hasChanged = currentSet.size !== newSet.size || 
                  Array.from(currentSet).some(item => !newSet.has(item)) ||
                  Array.from(newSet).some(item => !currentSet.has(item));
                
                if (hasChanged) {
                  isUpdatingFromFirebase.current = true;
                  setDailyCompleted(newSet);
                  dailyCompletedRef.current = newSet;
                  localStorage.setItem(
                    `ticktask_daily_completed_${user.uid}`,
                    JSON.stringify(data.tasks)
                  );
                  setTimeout(() => {
                    isUpdatingFromFirebase.current = false;
                  }, 500);
                }
              } else if (docId.startsWith("weekly_")) {
                const day = docId.replace("weekly_", "");
                currentSet = weeklyCompletedRef.current;
                const newSet = new Set(data.tasks);
                hasChanged = currentSet.size !== newSet.size || 
                  Array.from(currentSet).some(item => !newSet.has(item)) ||
                  Array.from(newSet).some(item => !currentSet.has(item));
                
                if (hasChanged) {
                  isUpdatingFromFirebase.current = true;
                  setWeeklyCompleted(newSet);
                  weeklyCompletedRef.current = newSet;
                  localStorage.setItem(
                    `ticktask_weekly_completed_${user.uid}_${day}`,
                    JSON.stringify(data.tasks)
                  );
                  setTimeout(() => {
                    isUpdatingFromFirebase.current = false;
                  }, 500);
                }
              }
            }
          });
        },
        (error) => {
          console.error("Failed to subscribe completed tasks", error);
          isUpdatingFromFirebase.current = false;
        }
      );

      // Firebase Running Task abonnieren für Echtzeit-Synchronisation
      const runningTaskDoc = doc(db, "users", user.uid, "settings", "runningTask");
      const unsubscribeRunningTask = onSnapshot(
        runningTaskDoc,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const firebaseRunningTaskId = data.taskId || null;
            
            
            // Verwende Ref um aktuellen Wert zu prüfen, ohne Dependency-Problem
            setRunningTaskId((currentRunningTaskId) => {
              // Nur updaten wenn sich der Wert geändert hat
              if (firebaseRunningTaskId !== currentRunningTaskId) {
                
                // Aktualisiere auch localStorage
                if (firebaseRunningTaskId) {
                  try {
                    localStorage.setItem(
                      `ticktask_running_task_${user.uid}`,
                      JSON.stringify(firebaseRunningTaskId)
                    );
                  } catch (e) {
                    console.error("Failed to save running task to localStorage", e);
                  }
                } else {
                  try {
                    localStorage.removeItem(`ticktask_running_task_${user.uid}`);
                  } catch (e) {
                    console.error("Failed to remove running task from localStorage", e);
                  }
                }
                
                return firebaseRunningTaskId;
              }
              return currentRunningTaskId;
            });
          }
        },
        (error) => {
          console.error("Failed to subscribe running task", error);
        }
      );

      return () => {
        unsubscribe();
        unsubscribeRoutine();
        unsubscribeWeekly();
        unsubscribeCompleted();
        unsubscribeRunningTask();
        // Verbindungsüberwachung stoppen beim Cleanup
        stopConnectionMonitoring();
        // Timer aufräumen
        if (minLoadingTimeRef.current) {
          clearTimeout(minLoadingTimeRef.current);
        }
      };
    }

    return () => {
      unsubscribe();
      unsubscribeRoutine();
      unsubscribeWeekly();
      // Verbindungsüberwachung stoppen beim Cleanup
      stopConnectionMonitoring();
      // Timer aufräumen
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
    };
  }, [user?.uid, isGuestMode]);

  // PWA: Aktualisiere Daten wenn App wieder sichtbar wird
  useEffect(() => {
    if (!user?.uid || isGuestMode) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Firebase-Verbindung erneut prüfen und aktivieren
        checkFirebaseConnection().then((connected) => {
          if (connected) {
            // Force refresh der completed tasks von Firebase
            const completedCol = collection(db, "users", user.uid, "completedTasks");
            getDocs(completedCol).then((snapshot) => {
              snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data();
                const docId = docSnap.id;

                if (Array.isArray(data.tasks)) {
                  if (docId === "morning") {
                    const newSet = new Set(data.tasks);
                    setMorningCompleted(newSet);
                    morningCompletedRef.current = newSet;
                    localStorage.setItem(
                      `ticktask_morning_completed_${user.uid}`,
                      JSON.stringify(data.tasks)
                    );
                  } else if (docId === "abend") {
                    const newSet = new Set(data.tasks);
                    setAbendCompleted(newSet);
                    abendCompletedRef.current = newSet;
                    localStorage.setItem(
                      `ticktask_abend_completed_${user.uid}`,
                      JSON.stringify(data.tasks)
                    );
                  } else if (docId === "daily") {
                    const newSet = new Set(data.tasks);
                    setDailyCompleted(newSet);
                    dailyCompletedRef.current = newSet;
                    localStorage.setItem(
                      `ticktask_daily_completed_${user.uid}`,
                      JSON.stringify(data.tasks)
                    );
                  } else if (docId.startsWith("weekly_")) {
                    const newSet = new Set(data.tasks);
                    setWeeklyCompleted(newSet);
                    weeklyCompletedRef.current = newSet;
                    const day = docId.replace("weekly_", "");
                    localStorage.setItem(
                      `ticktask_weekly_completed_${user.uid}_${day}`,
                      JSON.stringify(data.tasks)
                    );
                  }
                }
              });
            }).catch((error) => {
              console.error("❌ Fehler beim Aktualisieren der completed tasks:", error);
            });
          } else {
            console.warn("⚠️ Firebase-Verbindung konnte nicht wiederhergestellt werden");
          }
        });
      }
    };

    const handleFocus = () => {
      checkFirebaseConnection();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.uid, isGuestMode]);

  // Save completed states to localStorage whenever they change
  // WICHTIG: Nur speichern wenn States wirklich geändert wurden (nicht beim ersten Laden)

  // Prüfe ob runningTaskId noch in der Task-Liste existiert
  useEffect(() => {
    if (runningTaskId) {
      const currentTasks = isGuestMode ? guestData.tasks : tasks;
      const currentFrequentTemplates = isGuestMode
        ? guestData.frequentTemplates
        : frequentTemplates;
      const taskExists =
        currentTasks.some((task) => task.id === runningTaskId) ||
        currentFrequentTemplates.some((task) => task.id === runningTaskId);

      if (!taskExists) {
        setRunningTaskId(null);
        if (!isGuestMode && user?.uid) {
          localStorage.removeItem(`ticktask_running_task_${user.uid}`);
        }
      }
    }
  }, [
    tasks,
    frequentTemplates,
    runningTaskId,
    isGuestMode,
    user?.uid,
    guestData.tasks,
    guestData.frequentTemplates,
  ]);

  // Bereinige completed Sets NUR wenn Tasks in Settings gelöscht werden
  // Die Bereinigung passiert bereits in updateMorningTasks, updateAbendTasks, etc.
  // Diese Hooks sind nicht mehr nötig, da die Bereinigung direkt in den update-Funktionen passiert

  // Speichere completed-Tasks in localStorage und Firebase
  // HINWEIS: Das direkte Speichern in den Wrapper-Funktionen hat Priorität
  // Diese useEffect-Hooks sind als Fallback gedacht, falls das direkte Speichern fehlschlägt
  useEffect(() => {
    if (!hasLoadedCompletedStates.current) return;
    if (!user?.uid || isGuestMode) return;
    
    // Kurze Verzögerung, um zu prüfen ob das Flag noch gesetzt ist
    const timeoutId = setTimeout(() => {
      if (isUpdatingFromFirebase.current) {
        return;
      }

      // Prüfe ob localStorage bereits aktualisiert wurde (dann wurde auch direkt zu Firebase gespeichert)
      const morningCompletedKey = `ticktask_morning_completed_${user.uid}`;
      const stored = localStorage.getItem(morningCompletedKey);
      const currentArray = Array.from(morningCompleted);
      if (stored) {
        try {
          const storedArray = JSON.parse(stored);
          // Wenn localStorage bereits die aktuellen Werte hat, wurde bereits direkt gespeichert
          if (JSON.stringify(storedArray.sort()) === JSON.stringify(currentArray.sort())) {
            return; // Bereits gespeichert, kein erneutes Speichern nötig
          }
        } catch (e) {
          // Ignoriere Parse-Fehler
        }
      }

      const saveMorningCompleted = async () => {
        try {
          localStorage.setItem(
            morningCompletedKey,
            JSON.stringify(currentArray)
          );

          // Speichere auch in Firebase (Fallback)
          const completedDoc = doc(
            db,
            "users",
            user.uid,
            "completedTasks",
            "morning"
          );
          await setDoc(completedDoc, {
            tasks: currentArray,
            lastUpdated: serverTimestamp(),
          });
        } catch (e) {
          console.error("Failed to save morning completed tasks", e);
        }
      };

      saveMorningCompleted();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [morningCompleted, user?.uid, isGuestMode]);

  useEffect(() => {
    if (!hasLoadedCompletedStates.current) return;
    if (!user?.uid || isGuestMode) return;
    
    // Kurze Verzögerung, um zu prüfen ob das Flag noch gesetzt ist
    const timeoutId = setTimeout(() => {
      if (isUpdatingFromFirebase.current) {
        return;
      }

      const saveAbendCompleted = async () => {
        try {
          const abendCompletedKey = `ticktask_abend_completed_${user.uid}`;
          const abendCompletedArray = Array.from(abendCompleted);
          localStorage.setItem(
            abendCompletedKey,
            JSON.stringify(abendCompletedArray)
          );

          // Speichere auch in Firebase
          const completedDoc = doc(
            db,
            "users",
            user.uid,
            "completedTasks",
            "abend"
          );
          await setDoc(completedDoc, {
            tasks: abendCompletedArray,
            lastUpdated: serverTimestamp(),
          });
        } catch (e) {
          console.error("Failed to save abend completed tasks", e);
        }
      };

      saveAbendCompleted();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [abendCompleted, user?.uid, isGuestMode]);

  useEffect(() => {
    if (!hasLoadedCompletedStates.current) return;
    if (!user?.uid || isGuestMode) return;
    
    // Kurze Verzögerung, um zu prüfen ob das Flag noch gesetzt ist
    const timeoutId = setTimeout(() => {
      if (isUpdatingFromFirebase.current) {
        return;
      }

      const saveWeeklyCompleted = async () => {
        try {
          // Weekly completed tasks - tagesspezifisch speichern
          const today = new Date();
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const currentDay = dayNames[today.getDay()];
          const weeklyCompletedKey = `ticktask_weekly_completed_${user.uid}_${currentDay}`;
          const weeklyCompletedArray = Array.from(weeklyCompleted);
          localStorage.setItem(
            weeklyCompletedKey,
            JSON.stringify(weeklyCompletedArray)
          );

          // Speichere auch in Firebase
          const completedDoc = doc(
            db,
            "users",
            user.uid,
            "completedTasks",
            `weekly_${currentDay}`
          );
          await setDoc(completedDoc, {
            tasks: weeklyCompletedArray,
            day: currentDay,
            lastUpdated: serverTimestamp(),
          });
        } catch (e) {
          console.error("Failed to save weekly completed tasks", e);
        }
      };

      saveWeeklyCompleted();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [weeklyCompleted, user?.uid, isGuestMode]);

  useEffect(() => {
    if (!hasLoadedCompletedStates.current) return;
    if (!user?.uid || isGuestMode) return;
    
    // Kurze Verzögerung, um zu prüfen ob das Flag noch gesetzt ist
    const timeoutId = setTimeout(() => {
      if (isUpdatingFromFirebase.current) {
        return;
      }

      const saveDailyCompleted = async () => {
        try {
          const dailyCompletedKey = `ticktask_daily_completed_${user.uid}`;
          const dailyCompletedArray = Array.from(dailyCompleted);
          localStorage.setItem(
            dailyCompletedKey,
            JSON.stringify(dailyCompletedArray)
          );

          // Speichere auch in Firebase
          const completedDoc = doc(
            db,
            "users",
            user.uid,
            "completedTasks",
            "daily"
          );
          await setDoc(completedDoc, {
            tasks: dailyCompletedArray,
            lastUpdated: serverTimestamp(),
          });
        } catch (e) {
          console.error("Failed to save daily completed tasks", e);
        }
      };

      saveDailyCompleted();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [dailyCompleted, user?.uid, isGuestMode]);

  // Direktes Speichern zu Firebase (wie bei Tasks)
  const saveMorningCompletedToFirebase = async (completedArray) => {
    if (!user?.uid || isGuestMode) {
      return;
    }
    // Setze Flag, damit onSnapshot weiß, dass wir selbst speichern
    isUpdatingFromFirebase.current = true;
    try {
      const completedDoc = doc(
        db,
        "users",
        user.uid,
        "completedTasks",
        "morning"
      );
      await setDoc(completedDoc, {
        tasks: completedArray,
        lastUpdated: serverTimestamp(),
      });
    } catch (e) {
      console.error("❌ Failed to save morning completed tasks to Firebase", e);
      throw e; // Re-throw damit der Caller den Fehler sieht
    } finally {
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        isUpdatingFromFirebase.current = false;
      }, 300);
    }
  };

  const saveAbendCompletedToFirebase = async (completedArray) => {
    if (!user?.uid || isGuestMode) return;
    // Setze Flag, damit onSnapshot weiß, dass wir selbst speichern
    isUpdatingFromFirebase.current = true;
    try {
      const completedDoc = doc(
        db,
        "users",
        user.uid,
        "completedTasks",
        "abend"
      );
      await setDoc(completedDoc, {
        tasks: completedArray,
        lastUpdated: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to save abend completed tasks to Firebase", e);
    } finally {
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        isUpdatingFromFirebase.current = false;
      }, 300);
    }
  };

  const saveWeeklyCompletedToFirebase = async (completedArray) => {
    if (!user?.uid || isGuestMode) return;
    // Setze Flag, damit onSnapshot weiß, dass wir selbst speichern
    isUpdatingFromFirebase.current = true;
    try {
      const today = new Date();
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const currentDay = dayNames[today.getDay()];
      const completedDoc = doc(
        db,
        "users",
        user.uid,
        "completedTasks",
        `weekly_${currentDay}`
      );
      await setDoc(completedDoc, {
        tasks: completedArray,
        day: currentDay,
        lastUpdated: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to save weekly completed tasks to Firebase", e);
    } finally {
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        isUpdatingFromFirebase.current = false;
      }, 300);
    }
  };

  const saveDailyCompletedToFirebase = async (completedArray) => {
    if (!user?.uid || isGuestMode) return;
    // Setze Flag, damit onSnapshot weiß, dass wir selbst speichern
    isUpdatingFromFirebase.current = true;
    try {
      const completedDoc = doc(
        db,
        "users",
        user.uid,
        "completedTasks",
        "daily"
      );
      await setDoc(completedDoc, {
        tasks: completedArray,
        lastUpdated: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to save daily completed tasks to Firebase", e);
    } finally {
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        isUpdatingFromFirebase.current = false;
      }, 300);
    }
  };

  // Wrapper-Funktionen für Setter im Guest-Mode
  const setMorningCompletedWrapper = (value) => {
    if (isGuestMode) {
      const currentValue = guestData.morningCompleted || new Set();
      const newValue =
        typeof value === "function" ? value(currentValue) : value;
      updateGuestData({ morningCompleted: newValue });
      setMorningCompleted(newValue);
      morningCompletedRef.current = newValue;
    } else {
      const newValue = typeof value === "function" ? value(morningCompleted) : value;
      setMorningCompleted(newValue);
      morningCompletedRef.current = newValue;
      
      // Direkt zu Firebase speichern (wie bei Tasks) - mit await für PWA-Kompatibilität
      const completedArray = Array.from(newValue);
      const morningCompletedKey = `ticktask_morning_completed_${user.uid}`;
      try {
        localStorage.setItem(morningCompletedKey, JSON.stringify(completedArray));
      } catch (e) {
        console.error("Failed to save morning completed to localStorage", e);
      }
      // Wichtig: Promise nicht ignorieren, damit es in PWAs ausgeführt wird
      saveMorningCompletedToFirebase(completedArray).then(() => {
      }).catch((e) => {
        console.error("❌ Failed to save morning completed to Firebase", e);
      });
    }
  };

  const setAbendCompletedWrapper = (value) => {
    if (isGuestMode) {
      const currentValue = guestData.abendCompleted || new Set();
      const newValue =
        typeof value === "function" ? value(currentValue) : value;
      updateGuestData({ abendCompleted: newValue });
      setAbendCompleted(newValue);
      abendCompletedRef.current = newValue;
    } else {
      const newValue = typeof value === "function" ? value(abendCompleted) : value;
      setAbendCompleted(newValue);
      abendCompletedRef.current = newValue;
      
      // Direkt zu Firebase speichern (wie bei Tasks) - mit await für PWA-Kompatibilität
      const completedArray = Array.from(newValue);
      const abendCompletedKey = `ticktask_abend_completed_${user.uid}`;
      try {
        localStorage.setItem(abendCompletedKey, JSON.stringify(completedArray));
      } catch (e) {
        console.error("Failed to save abend completed to localStorage", e);
      }
      // Wichtig: Promise nicht ignorieren, damit es in PWAs ausgeführt wird
      saveAbendCompletedToFirebase(completedArray).catch((e) => {
        console.error("Failed to save abend completed to Firebase", e);
      });
    }
  };

  const setWeeklyCompletedWrapper = (value) => {
    if (isGuestMode) {
      const currentValue = guestData.weeklyCompleted || new Set();
      const newValue =
        typeof value === "function" ? value(currentValue) : value;
      updateGuestData({ weeklyCompleted: newValue });
      setWeeklyCompleted(newValue);
      weeklyCompletedRef.current = newValue;
    } else {
      const newValue = typeof value === "function" ? value(weeklyCompleted) : value;
      setWeeklyCompleted(newValue);
      weeklyCompletedRef.current = newValue;
      
      // Direkt zu Firebase speichern (wie bei Tasks) - mit await für PWA-Kompatibilität
      const completedArray = Array.from(newValue);
      const today = new Date();
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const currentDay = dayNames[today.getDay()];
      const weeklyCompletedKey = `ticktask_weekly_completed_${user.uid}_${currentDay}`;
      try {
        localStorage.setItem(weeklyCompletedKey, JSON.stringify(completedArray));
      } catch (e) {
        console.error("Failed to save weekly completed to localStorage", e);
      }
      // Wichtig: Promise nicht ignorieren, damit es in PWAs ausgeführt wird
      saveWeeklyCompletedToFirebase(completedArray).catch((e) => {
        console.error("Failed to save weekly completed to Firebase", e);
      });
    }
  };

  const setDailyCompletedWrapper = (value) => {
    if (isGuestMode) {
      const currentValue = guestData.dailyCompleted || new Set();
      const newValue =
        typeof value === "function" ? value(currentValue) : value;
      updateGuestData({ dailyCompleted: newValue });
      setDailyCompleted(newValue);
      dailyCompletedRef.current = newValue;
    } else {
      const newValue = typeof value === "function" ? value(dailyCompleted) : value;
      setDailyCompleted(newValue);
      dailyCompletedRef.current = newValue;
      
      // Direkt zu Firebase speichern (wie bei Tasks) - mit await für PWA-Kompatibilität
      const completedArray = Array.from(newValue);
      const dailyCompletedKey = `ticktask_daily_completed_${user.uid}`;
      try {
        localStorage.setItem(dailyCompletedKey, JSON.stringify(completedArray));
      } catch (e) {
        console.error("Failed to save daily completed to localStorage", e);
      }
      // Wichtig: Promise nicht ignorieren, damit es in PWAs ausgeführt wird
      saveDailyCompletedToFirebase(completedArray).catch((e) => {
        console.error("Failed to save daily completed to Firebase", e);
      });
    }
  };

  // Synchronisiere Streak zwischen Gast-Modus und normalem Modus
  useEffect(() => {
    if (isGuestMode && guestData.streak !== undefined) {
      setStreak(guestData.streak);
    } else if (!isGuestMode && user?.uid) {
      // Lade Streak aus localStorage wenn nicht im Gast-Modus
      try {
        const savedStreak = localStorage.getItem(`ticktask_streak_${user.uid}`);
        if (savedStreak) {
          setStreak(parseInt(savedStreak, 10));
        }
      } catch (e) {
        console.error("Failed to load streak from localStorage", e);
      }
    }
  }, [isGuestMode, guestData.streak, user?.uid]);

  // Debug: Log guestData.tasks changes
  useEffect(() => {
    if (isGuestMode) {
      if (guestData.tasks && guestData.tasks.length > 0) {
      }
    }
  }, [isGuestMode, guestData.tasks]);

  // Zeige Welcome-Popup im Guest-Mode immer an
  useEffect(() => {
    if (isGuestMode) {
      // Reset ref wenn Guest-Mode aktiviert wird
      guestWelcomeShownRef.current = false;

      // Zeige Popup sofort ohne Verzögerung
      if (!guestWelcomeShownRef.current) {
        setShowWelcomePopup(true);
        guestWelcomeShownRef.current = true;
      }
    } else {
      // Reset ref wenn Guest-Mode verlassen wird
      guestWelcomeShownRef.current = false;
    }
  }, [isGuestMode]);

  // Prüfe, ob Welcome-Popup angezeigt werden soll (nur einmal beim ersten Mal nach Registrierung)
  useEffect(() => {
    if (!user?.uid || isGuestMode || isLoading) return;

    // Warte kurz, damit die App vollständig geladen ist
    const checkWelcomePopup = async () => {
      try {
        // Prüfe zuerst, ob der Benutzer gerade registriert wurde (durch Flag in localStorage)
        const justRegisteredFlag = localStorage.getItem(
          `ticktask_justRegistered_${user.uid}`
        );

        if (justRegisteredFlag === "true") {
          // Benutzer wurde gerade registriert - zeige Popup
          // Prüfe zusätzlich in Firestore, ob das Popup bereits angezeigt wurde
          const profileDoc = doc(db, "users", user.uid, "profile", "welcome");
          const profileSnap = await getDoc(profileDoc);

          if (!profileSnap.exists() || !profileSnap.data().welcomeShown) {
            // Popup noch nicht angezeigt - zeige es nach kurzer Verzögerung
            setTimeout(() => {
              setShowWelcomePopup(true);
              // Entferne den Flag erst nachdem das Popup angezeigt wurde
              localStorage.removeItem(`ticktask_justRegistered_${user.uid}`);
            }, 500);
          } else {
            // Popup wurde bereits angezeigt - entferne den Flag trotzdem
            localStorage.removeItem(`ticktask_justRegistered_${user.uid}`);
          }
        }
        // Wenn justRegisteredFlag nicht gesetzt ist, wurde der Benutzer nicht gerade registriert
        // → Popup nicht anzeigen (normaler Login)
      } catch (e) {
        console.error("Failed to check welcome popup status", e);
        // Bei Fehler NICHT anzeigen - sicherstellen, dass es nur einmal erscheint
      }
    };

    // Prüfe nur einmal pro user.uid
    // Setze welcomeCheckedRef zurück, wenn sich der Benutzer ändert
    const currentUserId = user?.uid;
    if (welcomeCheckedRef.current !== currentUserId) {
      welcomeCheckedRef.current = currentUserId;
      checkWelcomePopup();
    }
  }, [user?.uid, isGuestMode, isLoading]);

  // Speichere, dass Welcome-Popup angezeigt wurde (wird nur einmal gespeichert)
  const handleWelcomeClose = async () => {
    setShowWelcomePopup(false);

    if (!user?.uid || isGuestMode) return;

    try {
      const profileDoc = doc(db, "users", user.uid, "profile", "welcome");
      await setDoc(
        profileDoc,
        {
          welcomeShown: true,
          shownAt: serverTimestamp(),
        },
        { merge: true }
      ); // merge: true verhindert Überschreibung anderer Felder
    } catch (e) {
      console.error("Failed to save welcome popup status", e);
      // Auch bei Fehler das Popup nicht erneut anzeigen
      // Der Benutzer hat es bereits gesehen
    }
  };

  // Handler für "Start Tutorial" Button
  const handleStartTutorial = () => {
    setShowWelcomePopup(false); // Schließe Welcome-Popup

    // Warte kurz, damit das Welcome-Popup geschlossen ist und alle Elemente gerendert sind
    setTimeout(() => {
      setIsTutorialActive(true);
      setCurrentTutorialStep(0);
      setTutorialPopupOpen(false);
    }, 100);
  };

  // Tutorial-Schritte
  const tutorialSteps = [
    {
      targetId: "task-input",
      message:
        "Hier kannst du deine Tasks definieren. Gib einfach den Namen deines Tasks ein und klicke auf den Pfeil.",
      position: "top",
      openPopup: false,
    },
    {
      targetId: "task-popup",
      message:
        "Anschließend kannst du deinen Task anpassen: Zeitdauer festlegen, Termin planen, als wichtig markieren oder einem Ziel zuweisen.",
      position: "left",
      openPopup: true,
    },
    {
      targetId: "checklist-pen-icon",
      message:
        "Mit diesem Stift-Icon kannst du deine Routinen und Checklisten anpassen.",
      position: "top",
      openPopup: false,
    },
    {
      targetId: "calendar-plus-icon",
      message:
        "Hier kannst du Alltagstermine hinzufügen, die regelmäßig stattfinden.",
      position: "top",
      openPopup: false,
      maxWidth: 250,
    },
    {
      targetId: "goals-input",
      message:
        "Hier kannst du deine Ziele definieren, die du erreichen möchtest.",
      position: "top",
      openPopup: false,
    },
    {
      targetId: "finish-day-button",
      message:
        "Mit diesem Button kannst du den Tag beenden, wenn alle Aufgaben und Routinen abgeschlossen sind, um deinen Streak zu erhalten.",
      position: "top",
      openPopup: false,
    },
    {
      targetId: "info-button",
      message:
        "Hier findest du weitere Informationen über die App und wie sie funktioniert.",
      position: "top",
      openPopup: false,
      maxWidth: 220,
    },
    // Weitere Schritte können hier hinzugefügt werden
  ];

  const handleTutorialNext = () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      const nextStep = currentTutorialStep + 1;
      const currentStep = tutorialSteps[currentTutorialStep];
      const nextStepData = tutorialSteps[nextStep];

      // Scroll zum nächsten Element, wenn es außerhalb des Viewports ist
      const scrollToNextElement = () => {
        if (nextStepData?.targetId) {
          const targetElement = document.getElementById(nextStepData.targetId);
          if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Prüfe, ob das Element außerhalb des Viewports ist
            // Oder wenn der aktuelle Schritt der checklist-pen-icon ist, immer scrollen
            if (
              rect.top < 0 ||
              rect.bottom > viewportHeight ||
              currentStep?.targetId === "checklist-pen-icon"
            ) {
              // Scroll zum Element mit etwas Abstand oben
              targetElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
            }
          }
        }
      };

      // Schließe Popup, wenn es im aktuellen Schritt geöffnet war
      if (currentStep?.openPopup) {
        setTutorialPopupOpen(false);
      }

      // Scroll zum nächsten Element
      scrollToNextElement();

      // Öffne Popup, wenn der nächste Schritt es erfordert
      if (nextStepData?.openPopup) {
        setTutorialPopupOpen(true);
      }

      // Wechsle Schritt sofort - Tooltip passt sich dynamisch an
      setCurrentTutorialStep(nextStep);
    } else {
      // Tutorial beendet
      setIsTutorialActive(false);
      setCurrentTutorialStep(0);
      setTutorialPopupOpen(false);
      // Scroll zum Anfang der Seite
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleTutorialSkip = () => {
    setIsTutorialActive(false);
    setCurrentTutorialStep(0);
    setTutorialPopupOpen(false);
  };

  const [task, _setTask] = useState({
    name: "",
    urgent: false,
    done: false,
    time: 0,
    neededTime: 0,
  });

  // Gast-Modus Warnung
  if (isGuestMode) {
    return (
      <div>
        <Header
          user={null}
          onLogout={() => {
            localStorage.removeItem("ticktask_guestMode");
            window.location.reload();
          }}
          weeklyTasks={currentWeeklyTasks}
          updateWeeklyTasks={updateWeeklyTasks}
          morningTasks={currentMorningTasks}
          updateMorningTasks={updateMorningTasks}
          abendTasks={currentAbendTasks}
          updateAbendTasks={updateAbendTasks}
          dailyTasks={currentDailyTasks}
          updateDailyTasks={updateDailyTasks}
          streak={streak}
          onResetStreak={resetStreak}
          tasks={guestData.tasks}
          morningCompleted={currentMorningCompleted}
          setMorningCompleted={setMorningCompletedWrapper}
          abendCompleted={currentAbendCompleted}
          setAbendCompleted={setAbendCompletedWrapper}
          dailyCompleted={currentDailyCompleted}
          setDailyCompleted={setDailyCompletedWrapper}
          weeklyCompleted={currentWeeklyCompleted}
          setWeeklyCompleted={setWeeklyCompletedWrapper}
          increaseStreak={increaseStreak}
          isGuestMode={true}
          showErrorMessage={showErrorMessage}
          updateGuestData={updateGuestData}
          guestData={guestData}
        />
        <Input
          onAdd={handleAdd}
          task={task}
          tasks={guestData.tasks}
          user={null}
          tutorialPopupOpen={tutorialPopupOpen}
          onTutorialPopupClose={handleTutorialNext}
          isTutorialMode={isTutorialActive && tutorialPopupOpen}
          isGuestMode={isGuestMode}
          updateGuestData={updateGuestData}
          guestData={guestData}
        />
        {isTutorialActive &&
          currentTutorialStep < tutorialSteps.length &&
          tutorialSteps[currentTutorialStep] && (
            <>
              <div
                className={tutorialOverlayStyles.overlay}
                onClick={(e) => e.stopPropagation()}
              />
              <TutorialTooltip
                targetId={tutorialSteps[currentTutorialStep].targetId}
                message={tutorialSteps[currentTutorialStep].message}
                position={tutorialSteps[currentTutorialStep].position}
                onNext={handleTutorialNext}
                onSkip={handleTutorialSkip}
                showNext={false}
                showSkip={true}
                maxWidth={tutorialSteps[currentTutorialStep].maxWidth}
                isFirstStep={currentTutorialStep === 0}
                isLastStep={currentTutorialStep === tutorialSteps.length - 1}
                currentStep={currentTutorialStep + 1}
                totalSteps={tutorialSteps.length}
              />
            </>
          )}
        <Main
          tasks={guestData.tasks || []}
          frequentTemplates={guestData.frequentTemplates || []}
          onDelete={handleDelete}
          onTaskDone={handleTaskDone}
          onEdit={handleEdit}
          onFrequentDelete={handleFrequentDelete}
          onCopyTask={handleCopyTask}
          weeklyTasks={currentWeeklyTasks}
          dailyTasks={currentDailyTasks}
          morningTasks={currentMorningTasks}
          abendTasks={currentAbendTasks}
          user={null}
          morningCompleted={currentMorningCompleted}
          setMorningCompleted={setMorningCompletedWrapper}
          abendCompleted={currentAbendCompleted}
          setAbendCompleted={setAbendCompletedWrapper}
          weeklyCompleted={currentWeeklyCompleted}
          setWeeklyCompleted={setWeeklyCompletedWrapper}
          dailyCompleted={currentDailyCompleted}
          setDailyCompleted={setDailyCompletedWrapper}
          runningTaskId={runningTaskId}
          onTaskStart={handleTaskStart}
          onTaskStop={handleTaskStop}
          onClearRunningTask={clearRunningTask}
          increaseStreak={increaseStreak}
          canIncreaseStreak={canIncreaseStreak}
          onClearAllDone={clearAllDoneTasks}
          isGuestMode={isGuestMode}
          updateGuestData={updateGuestData}
          guestData={guestData}
        />
        <ErrorMessage
          message={errorMessage}
          isVisible={showError}
          onClose={hideErrorMessage}
        />
        <WelcomePopup
          open={showWelcomePopup}
          onClose={handleWelcomeClose}
          onStartTutorial={handleStartTutorial}
        />
      </div>
    );
  }

  if (isLoading && user?.uid && !isGuestMode) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "#000000",
          gap: "20px",
          zIndex: 9999,
        }}
      >
        <Ring2
          size="40"
          stroke="5"
          strokeLength="0.25"
          bgOpacity="0.1"
          speed="0.8"
          color="#d5ff05"
        />
        <p
          style={{
            color: "#d5ff05",
            fontSize: "18px",
            margin: 0,
          }}
        >
          TickTask wird geladen
        </p>
      </div>
    );
  }

  return (
    <div>
      <Header
        user={user}
        onLogout={handleLogout}
        weeklyTasks={weeklyTasks}
        updateWeeklyTasks={updateWeeklyTasks}
        morningTasks={morningTasks}
        updateMorningTasks={updateMorningTasks}
        abendTasks={abendTasks}
        updateAbendTasks={updateAbendTasks}
        dailyTasks={dailyTasks}
        updateDailyTasks={updateDailyTasks}
        streak={streak}
        onResetStreak={resetStreak}
        tasks={tasks}
        morningCompleted={morningCompleted}
        setMorningCompleted={setMorningCompleted}
        abendCompleted={abendCompleted}
        setAbendCompleted={setAbendCompleted}
        dailyCompleted={dailyCompleted}
        setDailyCompleted={setDailyCompleted}
        weeklyCompleted={weeklyCompleted}
        setWeeklyCompleted={setWeeklyCompleted}
        increaseStreak={increaseStreak}
        showErrorMessage={showErrorMessage}
        updateGuestData={undefined}
        guestData={undefined}
      ></Header>
      <Input
        onAdd={handleAdd}
        task={task}
        tasks={tasks}
        user={user}
        tutorialPopupOpen={tutorialPopupOpen}
        onTutorialPopupClose={handleTutorialNext}
        isTutorialMode={isTutorialActive && tutorialPopupOpen}
      ></Input>
      {isTutorialActive &&
        currentTutorialStep < tutorialSteps.length &&
        tutorialSteps[currentTutorialStep] && (
          <>
            <div
              className={tutorialOverlayStyles.overlay}
              onClick={(e) => e.stopPropagation()}
            />
            <TutorialTooltip
              targetId={tutorialSteps[currentTutorialStep].targetId}
              message={tutorialSteps[currentTutorialStep].message}
              position={tutorialSteps[currentTutorialStep].position}
              onNext={handleTutorialNext}
              onSkip={handleTutorialSkip}
              showNext={false}
              showSkip={true}
              maxWidth={tutorialSteps[currentTutorialStep].maxWidth}
              isFirstStep={currentTutorialStep === 0}
              isLastStep={currentTutorialStep === tutorialSteps.length - 1}
              currentStep={currentTutorialStep + 1}
              totalSteps={tutorialSteps.length}
            />
          </>
        )}
      <Main
        tasks={tasks}
        frequentTemplates={frequentTemplates}
        onDelete={handleDelete}
        onTaskDone={handleTaskDone}
        onEdit={handleEdit}
        onFrequentDelete={handleFrequentDelete}
        onCopyTask={handleCopyTask}
        weeklyTasks={weeklyTasks}
        dailyTasks={dailyTasks}
        morningTasks={morningTasks}
        abendTasks={abendTasks}
        user={user}
        morningCompleted={morningCompleted}
        setMorningCompleted={setMorningCompleted}
        abendCompleted={abendCompleted}
        setAbendCompleted={setAbendCompleted}
        weeklyCompleted={weeklyCompleted}
        setWeeklyCompleted={setWeeklyCompleted}
        dailyCompleted={dailyCompleted}
        setDailyCompleted={setDailyCompleted}
        runningTaskId={runningTaskId}
        onTaskStart={handleTaskStart}
        onTaskStop={handleTaskStop}
        onClearAllDone={clearAllDoneTasks}
      ></Main>

      <ErrorMessage
        message={errorMessage}
        isVisible={showError}
        onClose={hideErrorMessage}
      />

      <ScheduleConfirmPopup
        open={scheduleConfirmOpen}
        onConfirm={handleScheduleConfirm}
        onCancel={handleScheduleCancel}
        taskText={taskToCopy?.text || ""}
      />

      <WelcomePopup
        open={showWelcomePopup}
        onClose={handleWelcomeClose}
        onStartTutorial={handleStartTutorial}
      />
    </div>
  );
}

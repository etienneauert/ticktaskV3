import { signOut } from "firebase/auth";
import {
  auth,
  db,
  startConnectionMonitoring,
  stopConnectionMonitoring,
} from "../firebase/firebase.js";
import Header from "./TicktaskPages/Header.jsx";
import Input from "./TicktaskPages/Input.jsx";
import Main from "./TicktaskPages/Main.jsx";
import ErrorMessage from "./TicktaskPages/ErrorMessage.jsx";
import { useGuestData } from "../hooks/useGuestData.js";
import { useEffect, useState, useRef } from "react";
import guestStyles from "./TicktaskPages/GuestBanner.module.css";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";

export function Ticktask({ user, isGuestMode = false }) {
  const isInitialLoad = useRef(true);

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

  // Streak state
  const [streak, setStreak] = useState(0);

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

    console.log("🔍 Streak Check:");
    console.log(
      "- Aktive Tasks:",
      activeTasks.length,
      "(Done/Frequent Tasks werden ignoriert)"
    );
    console.log(
      "- Morning OK:",
      morningOk,
      "(Tasks:",
      morningTasks.length,
      ")"
    );
    console.log("- Abend OK:", abendOk, "(Tasks:", abendTasks.length, ")");
    console.log(
      "- Weekly OK:",
      weeklyOk,
      "(Tasks:",
      todayWeeklyTasks.length,
      ")"
    );
    console.log(
      "- Daily OK:",
      dailyOk,
      "(Tasks:",
      currentDailyTasks.length,
      ")"
    );
    console.log("- Can increase:", canIncrease);

    return canIncrease;
  };

  const increaseStreak = () => {
    // Validierung erfolgt bereits im Button, daher keine weitere Prüfung nötig
    setStreak((prevStreak) => prevStreak + 1);
  };

  // Task running management
  const handleTaskStart = (taskId) => {
    console.log("handleTaskStart called with taskId:", taskId);
    console.log("Current runningTaskId:", runningTaskId);

    // If there's already a running task, block the new one
    if (runningTaskId && runningTaskId !== taskId) {
      console.log("Found existing running task:", runningTaskId);
      showErrorMessage("Nur ein Task kann gleichzeitig laufen!");
      return false;
    }

    console.log("Starting task:", taskId);
    setRunningTaskId(taskId);
    // Save to localStorage
    if (!isGuestMode && user?.uid) {
      try {
        localStorage.setItem(
          `ticktask_running_task_${user.uid}`,
          JSON.stringify(taskId)
        );
        console.log("Saved running task to localStorage:", taskId);
      } catch (e) {
        console.error("Failed to save running task to localStorage", e);
      }
    }
    return true;
  };

  const handleTaskStop = (taskId) => {
    console.log("handleTaskStop called with taskId:", taskId);
    console.log("Current runningTaskId:", runningTaskId);

    if (runningTaskId === taskId) {
      console.log("Stopping task:", taskId);
      setRunningTaskId(null);
      // Clear from localStorage
      if (!isGuestMode && user?.uid) {
        try {
          localStorage.removeItem(`ticktask_running_task_${user.uid}`);
          console.log("Cleared running task from localStorage");
        } catch (e) {
          console.error("Failed to clear running task from localStorage", e);
        }
      }
    } else {
      console.log("Task stop ignored - not the running task");
    }
  };

  // Force clear running task - for debugging
  const clearRunningTask = () => {
    console.log("Force clearing running task");
    setRunningTaskId(null);
    if (!isGuestMode && user?.uid) {
      try {
        localStorage.removeItem(`ticktask_running_task_${user.uid}`);
        console.log("Force cleared running task from localStorage");
      } catch (e) {
        console.error(
          "Failed to force clear running task from localStorage",
          e
        );
      }
    }
  };

  const updateWeeklyTasks = async (day, tasks) => {
    console.log("updateWeeklyTasks called:", day, tasks);

    setWeeklyTasks((prev) => {
      const newTasks = {
        ...prev,
        [day]: tasks,
      };

      // Im Gast-Modus: Gast-Daten aktualisieren
      if (isGuestMode) {
        updateGuestData({
          weeklyTasks: newTasks,
        });
        return newTasks;
      }

      // Lokal speichern
      try {
        const weeklyKey = `ticktask_weekly_tasks_${user.uid}`;
        localStorage.setItem(weeklyKey, JSON.stringify(newTasks));
        console.log("Saved to localStorage:", newTasks);
      } catch (e) {
        console.error("Failed to save weekly tasks locally", e);
      }

      return newTasks;
    });

    // Im Gast-Modus nicht zu Firebase speichern
    if (isGuestMode) {
      console.log("Guest mode: Not saving to Firebase");
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
      console.log("Saved to Firebase:", day, tasks);
    } catch (e) {
      console.error("Failed to save weekly tasks to Firebase", e);
    }
  };

  const updateMorningTasks = async (tasks) => {
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
      };
      updateGuestData({
        tasks: [...guestData.tasks, newTask],
      });
      return;
    }

    // Für angemeldete Benutzer: Direkt zu Firebase schreiben für Echtzeit-Sync
    try {
      console.log("🚀 Adding task to Firebase:", task);
      const tasksCol = collection(db, "users", user.uid, "tasks");
      const docRef = await addDoc(tasksCol, {
        text: task.text,
        urgent: !!task.urgent,
        done: false,
        taskDuration: parseInt(task.taskDuration) || 0,
        createdAt: serverTimestamp(),
        frequent: !!task.frequent,
      });
      console.log("✅ Task added to Firebase with ID:", docRef.id);
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
        console.log("🗑️ Deleting task from Firebase:", taskToDelete.id);
        const taskDoc = doc(db, "users", user.uid, "tasks", taskToDelete.id);
        await deleteDoc(taskDoc);
        console.log("✅ Task deleted from Firebase");
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
      updateGuestData({ tasks: updatedTasks });
      return;
    }

    // Für angemeldete Benutzer: Direkt zu Firebase schreiben für Echtzeit-Sync
    if (taskToComplete.id && !taskToComplete.id.startsWith("local-")) {
      try {
        console.log("🔄 Updating task in Firebase:", taskToComplete.id);
        const taskDoc = doc(db, "users", user.uid, "tasks", taskToComplete.id);
        await updateDoc(taskDoc, {
          done: true,
          completedAt: serverTimestamp(),
          actualTimeUsed: actualTime,
          plannedTime: taskDuration,
        });
        console.log("✅ Task updated in Firebase");
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
                }
              : task
          )
        );
      }
    }
  };

  const handleCopyTask = async (taskToCopy) => {
    if (!user?.uid) return;

    // Erstelle eine Kopie des Tasks mit neuer ID
    const copiedTask = {
      id: `local-${Date.now()}`, // Neue lokale ID
      text: taskToCopy.text,
      urgent: taskToCopy.urgent || false,
      done: false, // Als nicht abgeschlossen markieren
      taskDuration: parseInt(taskToCopy.taskDuration) || 0,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      // Entferne alte Zeit-Daten
      actualTimeUsed: undefined,
      plannedTime: undefined,
      completedAt: undefined,
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

  // Lade Tasks beim Start
  useEffect(() => {
    // Firebase Verbindungsüberwachung starten (nur für angemeldete Benutzer)
    if (user?.uid && !isGuestMode) {
      startConnectionMonitoring();
    }

    if (!user?.uid && !isGuestMode) {
      setTasks([]);
      setFrequentTemplates([]);
      return;
    }

    // Im Gast-Modus leere Listen setzen
    if (isGuestMode) {
      setTasks([]);
      setFrequentTemplates([]);
      return;
    }

    // Check if there's a running task and validate it
    if (!isGuestMode && user?.uid) {
      try {
        const stored = localStorage.getItem(
          `ticktask_running_task_${user.uid}`
        );
        if (stored) {
          const runningTaskId = JSON.parse(stored);
          console.log("Found running task:", runningTaskId);

          // Check if timer is actually still running
          const timerKey = `timer_${runningTaskId}`;
          const timerState = localStorage.getItem(timerKey);

          if (timerState) {
            const parsed = JSON.parse(timerState);
            if (parsed.isRunning && !parsed.isCompleted) {
              console.log("Timer is still running, keeping running task");
              setRunningTaskId(runningTaskId);
            } else {
              console.log("Timer is not running, clearing running task");
              setRunningTaskId(null);
              localStorage.removeItem(`ticktask_running_task_${user.uid}`);
            }
          } else {
            console.log("No timer state found, clearing running task");
            setRunningTaskId(null);
            localStorage.removeItem(`ticktask_running_task_${user.uid}`);
          }
        }
      } catch (e) {
        console.error("Failed to check running task state", e);
        setRunningTaskId(null);
        localStorage.removeItem(`ticktask_running_task_${user.uid}`);
      }
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
        console.log("Weekly tasks snapshot:", snapshot.docs.length, "docs");
        const serverWeeklyTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Server weekly tasks:", serverWeeklyTasks);

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
          console.log("🔄 Loading weekly data from Firebase:", weeklyData);

          // Direkte Synchronisation mit Firebase-Daten für Echtzeit-Sync
          setWeeklyTasks(weeklyData);

          // Speichere Firebase-Daten in localStorage für Offline-Zugriff
          try {
            localStorage.setItem(
              `ticktask_weekly_tasks_${user.uid}`,
              JSON.stringify(weeklyData)
            );
            console.log("💾 Saved Firebase weekly tasks to localStorage");
          } catch (e) {
            console.error(
              "Failed to save Firebase weekly tasks to localStorage",
              e
            );
          }
        } else {
          console.log("No weekly tasks found in Firebase");
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

    // Lokale completed states laden
    try {
      const morningCompletedKey = `ticktask_morning_completed_${user.uid}`;
      const morningCompletedRaw = localStorage.getItem(morningCompletedKey);
      if (morningCompletedRaw && morningCompletedRaw !== "[]") {
        const morningCompletedArray = JSON.parse(morningCompletedRaw);
        setMorningCompleted(new Set(morningCompletedArray));
      }
    } catch (e) {
      console.error("Failed to load morning completed tasks", e);
    }

    try {
      const abendCompletedKey = `ticktask_abend_completed_${user.uid}`;
      const abendCompletedRaw = localStorage.getItem(abendCompletedKey);
      if (abendCompletedRaw && abendCompletedRaw !== "[]") {
        const abendCompletedArray = JSON.parse(abendCompletedRaw);
        setAbendCompleted(new Set(abendCompletedArray));
      }
    } catch (e) {
      console.error("Failed to load abend completed tasks", e);
    }

    try {
      // Weekly completed tasks - tagesspezifisch laden
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
      if (weeklyCompletedRaw && weeklyCompletedRaw !== "[]") {
        const weeklyCompletedArray = JSON.parse(weeklyCompletedRaw);
        setWeeklyCompleted(new Set(weeklyCompletedArray));
      }
    } catch (e) {
      console.error("Failed to load weekly completed tasks", e);
    }

    try {
      const dailyCompletedKey = `ticktask_daily_completed_${user.uid}`;
      const dailyCompletedRaw = localStorage.getItem(dailyCompletedKey);
      if (dailyCompletedRaw && dailyCompletedRaw !== "[]") {
        const dailyCompletedArray = JSON.parse(dailyCompletedRaw);
        setDailyCompleted(new Set(dailyCompletedArray));
      }
    } catch (e) {
      console.error("Failed to load daily completed tasks", e);
    }

    // Firebase Routine Tasks abonnieren
    const routineCol = collection(db, "users", user.uid, "routineTasks");
    const unsubscribeRoutine = onSnapshot(
      routineCol,
      (snapshot) => {
        console.log("Routine tasks snapshot:", snapshot.docs.length, "docs");
        const serverRoutineTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Server routine tasks:", serverRoutineTasks);

        // Morning Tasks aus Firebase laden
        const morningTask = serverRoutineTasks.find(
          (task) => task.type === "morning"
        );
        if (morningTask && Array.isArray(morningTask.tasks)) {
          console.log(
            "🔄 Loading morning tasks from Firebase:",
            morningTask.tasks
          );
          setMorningTasks(morningTask.tasks);
          // Auch in localStorage speichern für Offline-Zugriff
          try {
            localStorage.setItem(
              `ticktask_morning_tasks_${user.uid}`,
              JSON.stringify(morningTask.tasks)
            );
            console.log("💾 Saved Firebase morning tasks to localStorage");
          } catch (e) {
            console.error("Failed to save morning tasks to localStorage", e);
          }
        }

        // Abend Tasks aus Firebase laden
        const abendTask = serverRoutineTasks.find(
          (task) => task.type === "abend"
        );
        if (abendTask && Array.isArray(abendTask.tasks)) {
          console.log("🔄 Loading abend tasks from Firebase:", abendTask.tasks);
          setAbendTasks(abendTask.tasks);
          // Auch in localStorage speichern für Offline-Zugriff
          try {
            localStorage.setItem(
              `ticktask_abend_tasks_${user.uid}`,
              JSON.stringify(abendTask.tasks)
            );
            console.log("💾 Saved Firebase abend tasks to localStorage");
          } catch (e) {
            console.error("Failed to save abend tasks to localStorage", e);
          }
        }

        // Daily Tasks aus Firebase laden
        const dailyTask = serverRoutineTasks.find(
          (task) => task.type === "daily"
        );
        if (dailyTask && Array.isArray(dailyTask.tasks)) {
          console.log("🔄 Loading daily tasks from Firebase:", dailyTask.tasks);
          setDailyTasks(dailyTask.tasks);
          // Auch in localStorage speichern für Offline-Zugriff
          try {
            localStorage.setItem(
              `ticktask_daily_tasks_${user.uid}`,
              JSON.stringify(dailyTask.tasks)
            );
            console.log("💾 Saved Firebase daily tasks to localStorage");
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
        console.log("📡 Server tasks (", serverTasks.length, ")", serverTasks);

        // Direkte Synchronisation mit Firebase für Echtzeit-Sync zwischen Geräten
        setTasks(serverTasks);

        // Speichere Firebase-Daten in localStorage für Offline-Zugriff
        try {
          localStorage.setItem(
            `ticktask_tasks_${user.uid}`,
            JSON.stringify(serverTasks)
          );
          console.log(
            "💾 Saved Firebase tasks to localStorage:",
            serverTasks.length,
            "tasks"
          );
        } catch (e) {
          console.error("Failed to save Firebase tasks to localStorage", e);
        }
      },
      (error) => {
        console.error("❌ Failed to subscribe tasks", error);
      }
    );
    return () => {
      unsubscribe();
      unsubscribeRoutine();
      unsubscribeWeekly();
      // Verbindungsüberwachung stoppen beim Cleanup
      stopConnectionMonitoring();
    };
  }, [user?.uid]);

  // Save completed states to localStorage whenever they change
  useEffect(() => {
    if (user?.uid && !isGuestMode) {
      try {
        const morningCompletedKey = `ticktask_morning_completed_${user.uid}`;
        const morningCompletedArray = Array.from(morningCompleted);
        localStorage.setItem(
          morningCompletedKey,
          JSON.stringify(morningCompletedArray)
        );
      } catch (e) {
        console.error("Failed to save morning completed tasks", e);
      }
    }
  }, [morningCompleted, user?.uid, isGuestMode]);

  useEffect(() => {
    if (user?.uid && !isGuestMode) {
      try {
        const abendCompletedKey = `ticktask_abend_completed_${user.uid}`;
        const abendCompletedArray = Array.from(abendCompleted);
        localStorage.setItem(
          abendCompletedKey,
          JSON.stringify(abendCompletedArray)
        );
      } catch (e) {
        console.error("Failed to save abend completed tasks", e);
      }
    }
  }, [abendCompleted, user?.uid, isGuestMode]);

  useEffect(() => {
    if (user?.uid && !isGuestMode) {
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
        console.log(
          "Ticktask: Saving weekly completed for day:",
          currentDay,
          "key:",
          weeklyCompletedKey,
          "data:",
          weeklyCompletedArray
        );
        localStorage.setItem(
          weeklyCompletedKey,
          JSON.stringify(weeklyCompletedArray)
        );
      } catch (e) {
        console.error("Failed to save weekly completed tasks", e);
      }
    }
  }, [weeklyCompleted, user?.uid, isGuestMode]);

  useEffect(() => {
    if (user?.uid && !isGuestMode) {
      try {
        const dailyCompletedKey = `ticktask_daily_completed_${user.uid}`;
        const dailyCompletedArray = Array.from(dailyCompleted);
        localStorage.setItem(
          dailyCompletedKey,
          JSON.stringify(dailyCompletedArray)
        );
      } catch (e) {
        console.error("Failed to save daily completed tasks", e);
      }
    }
  }, [dailyCompleted, user?.uid, isGuestMode]);

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
        <div className={guestStyles.guestBanner}>
          <p className={guestStyles.guestText}>Willkommen im Demo-Modus!</p>
          <button
            onClick={() => {
              // Wechsle direkt zur Registrierung
              localStorage.setItem("ticktask_showAuth", "true");
              window.location.reload();
            }}
            className={guestStyles.guestButton}
          >
            Jetzt registrieren
          </button>
        </div>
        <Header
          user={null}
          onLogout={() => window.location.reload()}
          weeklyTasks={currentWeeklyTasks}
          updateWeeklyTasks={updateWeeklyTasks}
          morningTasks={currentMorningTasks}
          updateMorningTasks={updateMorningTasks}
          abendTasks={currentAbendTasks}
          updateAbendTasks={updateAbendTasks}
          dailyTasks={currentDailyTasks}
          updateDailyTasks={updateDailyTasks}
          streak={streak}
        />
        <Input onAdd={handleAdd} task={task} tasks={guestData.tasks} />
        <Main
          tasks={guestData.tasks}
          frequentTemplates={guestData.frequentTemplates}
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
          setMorningCompleted={setMorningCompleted}
          abendCompleted={currentAbendCompleted}
          setAbendCompleted={setAbendCompleted}
          weeklyCompleted={currentWeeklyCompleted}
          setWeeklyCompleted={setWeeklyCompleted}
          dailyCompleted={currentDailyCompleted}
          setDailyCompleted={setDailyCompleted}
          runningTaskId={runningTaskId}
          onTaskStart={handleTaskStart}
          onTaskStop={handleTaskStop}
          onClearRunningTask={clearRunningTask}
          increaseStreak={increaseStreak}
          canIncreaseStreak={canIncreaseStreak}
        />
        <ErrorMessage
          message={errorMessage}
          isVisible={showError}
          onClose={hideErrorMessage}
        />
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
      ></Header>
      <Input onAdd={handleAdd} task={task} tasks={tasks}></Input>
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
        onClearRunningTask={clearRunningTask}
        increaseStreak={increaseStreak}
        canIncreaseStreak={canIncreaseStreak}
      ></Main>

      <ErrorMessage
        message={errorMessage}
        isVisible={showError}
        onClose={hideErrorMessage}
      />
    </div>
  );
}

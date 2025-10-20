import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase.js";
import Header from "./TicktaskPages/Header.jsx";
import Input from "./TicktaskPages/Input.jsx";
import Main from "./TicktaskPages/Main.jsx";
import ErrorMessage from "./TicktaskPages/ErrorMessage.jsx";
import { useGuestData } from "../hooks/useGuestData.js";
import { useEffect, useState, useRef } from "react";
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

  // Global running task state
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

  // Task running management
  const handleTaskStart = (taskId) => {
    if (runningTaskId && runningTaskId !== taskId) {
      showErrorMessage("Nur ein Task kann gleichzeitig laufen!");
      return false;
    }
    setRunningTaskId(taskId);
    return true;
  };

  const handleTaskStop = (taskId) => {
    if (runningTaskId === taskId) {
      setRunningTaskId(null);
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

    // Sofort lokal hinzufügen
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

    // Im Gast-Modus: Gast-Daten aktualisieren
    if (isGuestMode) {
      updateGuestData({
        tasks: [...guestData.tasks, newTask],
      });
      return;
    }

    // Lokal speichern
    try {
      const cacheKey = `ticktask_tasks_${user.uid}`;
      const updated = [...tasks, newTask];
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save locally", e);
    }

    // Im Hintergrund zu Firestore hinzufügen
    try {
      const tasksCol = collection(db, "users", user.uid, "tasks");
      await addDoc(tasksCol, {
        text: task.text,
        urgent: !!task.urgent,
        done: false,
        taskDuration: parseInt(task.taskDuration) || 0,
        createdAt: serverTimestamp(),
        frequent: !!task.frequent,
      });
    } catch (e) {
      console.error("Failed to add task to Firestore", e);
    }
  };

  const handleDelete = async (taskToDelete) => {
    if (!user?.uid && !isGuestMode) return;

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

    // Normale Löschung für alle tasks
    // Sofort lokal entfernen
    setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id));

    // Lokal speichern
    try {
      const cacheKey = `ticktask_tasks_${user.uid}`;
      const updatedTasks = tasks.filter((task) => task.id !== taskToDelete.id);
      localStorage.setItem(cacheKey, JSON.stringify(updatedTasks));
    } catch (e) {
      console.error("Failed to save locally", e);
    }

    // Aus Firestore löschen (nur wenn es eine echte Firestore-ID hat)
    if (taskToDelete.id && !taskToDelete.id.startsWith("local-")) {
      try {
        const taskDoc = doc(db, "users", user.uid, "tasks", taskToDelete.id);
        await deleteDoc(taskDoc);
      } catch (e) {
        console.error("Failed to delete from Firestore", e);
      }
    }
  };

  const handleTaskDone = async (taskToComplete, actualTimeUsed = null) => {
    if (!user?.uid && !isGuestMode) return;

    // Berechne tatsächlich verbrauchte Zeit
    const taskDuration = parseInt(taskToComplete.taskDuration) || 0;
    const actualTime = actualTimeUsed || taskDuration; // Falls keine Zeit übergeben, verwende geplante Zeit

    // Sofort lokal als erledigt markieren
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

    // Lokal speichern
    try {
      const cacheKey = `ticktask_tasks_${user.uid}`;
      const updatedTasks = tasks.map((task) =>
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
      localStorage.setItem(cacheKey, JSON.stringify(updatedTasks));
    } catch (e) {
      console.error("Failed to save locally", e);
    }

    // In Firestore als erledigt markieren (nur wenn es eine echte Firestore-ID hat)
    if (taskToComplete.id && !taskToComplete.id.startsWith("local-")) {
      try {
        const taskDoc = doc(db, "users", user.uid, "tasks", taskToComplete.id);
        await updateDoc(taskDoc, {
          done: true,
          completedAt: serverTimestamp(),
          actualTimeUsed: actualTime,
          plannedTime: taskDuration,
        });
      } catch (e) {
        console.error("Failed to update task in Firestore", e);
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
          console.log("Setting weekly data:", weeklyData);
          setWeeklyTasks(weeklyData);
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
          setMorningTasks(morningTask.tasks);
        }

        // Abend Tasks aus Firebase laden
        const abendTask = serverRoutineTasks.find(
          (task) => task.type === "abend"
        );
        if (abendTask && Array.isArray(abendTask.tasks)) {
          setAbendTasks(abendTask.tasks);
        }

        // Daily Tasks aus Firebase laden
        const dailyTask = serverRoutineTasks.find(
          (task) => task.type === "daily"
        );
        if (dailyTask && Array.isArray(dailyTask.tasks)) {
          setDailyTasks(dailyTask.tasks);
        }
      },
      (error) => {
        console.error("Failed to subscribe routine tasks", error);
      }
    );

    // Completed-States werden innerhalb der jeweiligen Checklisten gespeichert/geladen

    // Firestore im Hintergrund abonnieren (nur für Updates, nicht zum Überschreiben)
    const tasksCol = collection(db, "users", user.uid, "tasks");
    const unsubscribe = onSnapshot(
      tasksCol,
      (snapshot) => {
        const serverTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.debug("Server tasks (", serverTasks.length, ")", serverTasks);

        // Synchronisiere mit Server: füge neue hinzu und entferne gelöschte
        setTasks((prev) => {
          const merged = [...prev];

          // Entferne lokale Tasks, die nicht mehr auf dem Server existieren
          const filtered = merged.filter((localTask) => {
            // Behalte lokale Tasks (die mit "local-" beginnen)
            if (localTask.id && localTask.id.startsWith("local-")) {
              return true;
            }
            // Entferne Server-Tasks, die nicht mehr auf dem Server existieren
            return serverTasks.some(
              (serverTask) => serverTask.id === localTask.id
            );
          });

          // Füge neue Server-Tasks hinzu
          serverTasks.forEach((serverTask) => {
            const exists = filtered.some(
              (local) =>
                local.id === serverTask.id ||
                (local.text === serverTask.text &&
                  local.urgent === serverTask.urgent)
            );
            if (!exists) {
              filtered.push(serverTask);
            }
          });

          return filtered;
        });
      },
      (error) => {
        console.error("Failed to subscribe tasks", error);
      }
    );
    return () => {
      unsubscribe();
      unsubscribeRoutine();
      unsubscribeWeekly();
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
        <div
          style={{
            background:
              "linear-gradient(180deg, rgb(252, 46, 46),rgb(255, 11, 11))",
            color: "white",
            fontSize: "20px",
            textAlign: "center",
            borderRadius: "0 0 8px 8px ",

            boxShadow: "0 4px 15px rgb(222, 15, 15)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "50px",
            maxHeight: "50px",
            padding: "10px",
          }}
        >
          <p style={{ backgroundColor: "transparent" }}>
            Willkommen im Demo-Modus!
          </p>
          <button
            onClick={() => {
              // Wechsle direkt zur Registrierung
              localStorage.setItem("ticktask_showAuth", "true");
              window.location.reload();
            }}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "0",
              alignSelf: "center",
            }}
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
      ></Main>

      <ErrorMessage
        message={errorMessage}
        isVisible={showError}
        onClose={hideErrorMessage}
      />
    </div>
  );
}

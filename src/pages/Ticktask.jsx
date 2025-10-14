import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase.js";
import Header from "./TicktaskPages/Header.jsx";
import Input from "./TicktaskPages/Input.jsx";
import Main from "./TicktaskPages/Main.jsx";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

export function Ticktask({ user }) {
  const handleLogout = () => {
    signOut(auth);
  };

  const handleAdd = async (task) => {
    if (!user?.uid) return;

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
    if (!user?.uid) return;

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
    if (!user?.uid) return;

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
    if (!user?.uid) {
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
    return () => unsubscribe();
  }, [user?.uid]);

  const [task, setTask] = useState({
    name: "",
    urgent: false,
    done: false,
    time: 0,
    neededTime: 0,
  });

  return (
    <div>
      <Header user={user} onLogout={handleLogout}></Header>
      <Input onAdd={handleAdd} task={task} tasks={tasks}></Input>
      <Main
        tasks={tasks}
        frequentTemplates={frequentTemplates}
        onDelete={handleDelete}
        onTaskDone={handleTaskDone}
        onEdit={handleEdit}
        onFrequentDelete={handleFrequentDelete}
        onCopyTask={handleCopyTask}
      ></Main>
    </div>
  );
}

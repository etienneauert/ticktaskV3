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
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to add task to Firestore", e);
    }
  };

  const handleDelete = async (taskToDelete) => {
    if (!user?.uid) return;

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

  const [tasks, setTasks] = useState([]);

  // Lade Tasks beim Start
  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
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

        // Nur mergen, nicht überschreiben
        setTasks((prev) => {
          const merged = [...prev];
          serverTasks.forEach((serverTask) => {
            const exists = merged.some(
              (local) =>
                local.id === serverTask.id ||
                (local.text === serverTask.text &&
                  local.urgent === serverTask.urgent)
            );
            if (!exists) {
              merged.push(serverTask);
            }
          });
          return merged;
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
      <Main tasks={tasks} onDelete={handleDelete}></Main>
    </div>
  );
}

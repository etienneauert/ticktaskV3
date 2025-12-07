import styles from "./SettingsPopup.module.css";
import { useState, useEffect } from "react";
import { db } from "../../../firebase/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function GoalsTab({ user }) {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      // Im Gast-Modus: Standard verwenden
      setIsHidden(false);
      return;
    }
    loadGoalsSettings();
  }, [user?.uid]);

  const loadGoalsSettings = async () => {
    if (!user?.uid) return;

    try {
      // Versuche zuerst localStorage
      const localHidden = localStorage.getItem(
        `ticktask_goals_hidden_${user.uid}`
      );
      if (localHidden === "true") {
        setIsHidden(true);
      }

      // Dann Firebase
      const settingsDoc = doc(db, "users", user.uid, "settings", "goals");
      const settingsSnap = await getDoc(settingsDoc);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.hidden !== undefined) {
          setIsHidden(data.hidden);
          localStorage.setItem(
            `ticktask_goals_hidden_${user.uid}`,
            String(data.hidden)
          );
        }
      }
    } catch (e) {
      console.error("Failed to load goals settings", e);
    }
  };

  const saveGoalsSettings = async (newHidden) => {
    if (!user?.uid) return;

    const hidden = newHidden !== undefined ? newHidden : isHidden;

    // Speichere in localStorage
    try {
      localStorage.setItem(
        `ticktask_goals_hidden_${user.uid}`,
        String(hidden)
      );
    } catch (e) {
      console.error("Failed to save goals settings locally", e);
    }

    // Speichere in Firebase
    try {
      const settingsDoc = doc(db, "users", user.uid, "settings", "goals");
      await setDoc(settingsDoc, {
        hidden: hidden,
        lastUpdated: serverTimestamp(),
      });
      console.log("Saved goals settings to Firebase:", { hidden });

      // Dispatch Event für automatische Aktualisierung
      window.dispatchEvent(
        new CustomEvent("goalsSettingsChanged", {
          detail: { hidden },
        })
      );
    } catch (e) {
      console.error("Failed to save goals settings to Firebase", e);
    }
  };

  const handleHiddenToggle = () => {
    const newHidden = !isHidden;
    setIsHidden(newHidden);
    saveGoalsSettings(newHidden);
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.generalSection}>
        <div className={styles.streakRow}>
          <span className={styles.languageLabel}>Sichtbarkeit:</span>
          <button
            className={styles.calendarToggleButton}
            onClick={handleHiddenToggle}
          >
            {isHidden ? "Einblenden" : "Ausblenden"}
          </button>
        </div>
      </div>
    </div>
  );
}


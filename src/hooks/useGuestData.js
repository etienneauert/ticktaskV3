import { useState, useEffect } from "react";

export const useGuestData = (isGuestMode) => {
  const [guestData, setGuestData] = useState({
    tasks: [],
    frequentTemplates: [],
    appointments: [],
    weeklyTasks: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    morningTasks: [],
    abendTasks: [],
    dailyTasks: [],
    morningCompleted: new Set(),
    abendCompleted: new Set(),
    weeklyCompleted: new Set(),
    dailyCompleted: new Set(),
    streak: 0,
  });

  useEffect(() => {
    if (isGuestMode) {
      // Lade Gast-Daten aus localStorage
      const saved = localStorage.getItem("ticktask_guest_data");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Konvertiere Sets zurück
          if (parsed.morningCompleted) {
            parsed.morningCompleted = new Set(parsed.morningCompleted);
          }
          if (parsed.abendCompleted) {
            parsed.abendCompleted = new Set(parsed.abendCompleted);
          }
          if (parsed.weeklyCompleted) {
            parsed.weeklyCompleted = new Set(parsed.weeklyCompleted);
          }
          if (parsed.dailyCompleted) {
            parsed.dailyCompleted = new Set(parsed.dailyCompleted);
          }
          setGuestData(parsed);
        } catch (e) {
          console.error("Failed to load guest data:", e);
        }
      }
    }
  }, [isGuestMode]);

  const updateGuestData = (newData) => {
    if (isGuestMode) {
      setGuestData((prevData) => {
        const updated = typeof newData === 'function' 
          ? newData(prevData)
          : { ...prevData, ...newData };
        
        // Speichere in localStorage
        const dataToSave = {
          ...updated,
          morningCompleted: Array.from(updated.morningCompleted || new Set()),
          abendCompleted: Array.from(updated.abendCompleted || new Set()),
          weeklyCompleted: Array.from(updated.weeklyCompleted || new Set()),
          dailyCompleted: Array.from(updated.dailyCompleted || new Set()),
        };
        localStorage.setItem("ticktask_guest_data", JSON.stringify(dataToSave));
        
        return updated;
      });
    }
  };

  const clearGuestData = () => {
    if (isGuestMode) {
      localStorage.removeItem("ticktask_guest_data");
      setGuestData({
        tasks: [],
        frequentTemplates: [],
        appointments: [],
        weeklyTasks: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
        morningTasks: [],
        abendTasks: [],
        dailyTasks: [],
        morningCompleted: new Set(),
        abendCompleted: new Set(),
        weeklyCompleted: new Set(),
        dailyCompleted: new Set(),
        streak: 0,
      });
    }
  };

  return { guestData, updateGuestData, clearGuestData };
};

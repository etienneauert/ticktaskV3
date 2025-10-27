import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Lade Sprache aus localStorage oder verwende Deutsch als Standard
    const savedLanguage = localStorage.getItem("ticktask_language");
    return savedLanguage || "de";
  });

  useEffect(() => {
    // Speichere Sprache in localStorage wenn sie sich ändert
    localStorage.setItem("ticktask_language", language);
  }, [language]);

  const translations = {
    de: {
      // App allgemein
      loading: "Wird geladen...",

      // Header
      settings: "Einstellungen",
      logout: "Abmelden",

      // General Tab
      streak: "Streak",
      reset: "Zurücksetzen",
      language: "Sprache",
      german: "Deutsch",
      english: "Englisch",

      // Tasks
      addTask: "Task hinzufügen",
      doneTasks: "Erledigte Tasks",
      frequentTasks: "Häufige Tasks",
      clearAll: "Alle löschen",

      // Timer
      done: "Fertig",
      pause: "Pause",
      play: "Abspielen",
      reset: "Zurücksetzen",

      // Days
      monday: "Montag",
      tuesday: "Dienstag",
      wednesday: "Mittwoch",
      thursday: "Donnerstag",
      friday: "Freitag",
      saturday: "Samstag",
      sunday: "Sonntag",

      // Routines
      morningRoutine: "Morgenroutine",
      eveningRoutine: "Abendroutine",
      dailyTasks: "Tägliche Tasks",
      weeklyTasks: "Wöchentliche Tasks",

      // Messages
      confirmResetStreak: "Möchtest du den Streak wirklich auf 0 zurücksetzen?",
      confirmClearAll: "Möchtest du alle erledigten Tasks löschen?",

      // Auth
      login: "Anmelden",
      register: "Registrieren",
      guestMode: "Gast-Modus",
      email: "E-Mail",
      password: "Passwort",
      confirmPassword: "Passwort bestätigen",

      // Guest Banner
      guestModeActive: "Gast-Modus aktiv",
      signUpToSave: "Melde dich an, um deine Daten zu speichern",

      // Settings Tabs
      general: "Allgemein",
      routine: "Routine",
      weekly: "Wöchentlich",
      daily: "Täglich",

      // Placeholders
      noTasksYet: "Noch keine Tasks",
      addTaskPlaceholder: "Task hinzufügen...",

      // Common
      add: "Hinzufügen",
      delete: "Löschen",
      edit: "Bearbeiten",
      save: "Speichern",
      cancel: "Abbrechen",

      // Checklist Headings
      morning: "Morgen",
      evening: "Abend",
      daily: "Täglich",
      weekly: "Wöchentlich",
      noTasksForToday: "Keine Tasks für heute",
    },
    en: {
      // App general
      loading: "Loading...",

      // Header
      settings: "Settings",
      logout: "Logout",

      // General Tab
      streak: "Streak",
      reset: "Reset",
      language: "Language",
      german: "German",
      english: "English",

      // Tasks
      addTask: "Add Task",
      doneTasks: "Done Tasks",
      frequentTasks: "Frequent Tasks",
      clearAll: "Clear All",

      // Timer
      done: "Done",
      pause: "Pause",
      play: "Play",
      reset: "Reset",

      // Days
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",

      // Routines
      morningRoutine: "Morning Routine",
      eveningRoutine: "Evening Routine",
      dailyTasks: "Daily Tasks",
      weeklyTasks: "Weekly Tasks",

      // Messages
      confirmResetStreak: "Do you really want to reset the streak to 0?",
      confirmClearAll: "Do you want to delete all done tasks?",

      // Auth
      login: "Login",
      register: "Register",
      guestMode: "Guest Mode",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",

      // Guest Banner
      guestModeActive: "Guest mode active",
      signUpToSave: "Sign up to save your data",

      // Settings Tabs
      general: "General",
      routine: "Routine",
      weekly: "Weekly",
      daily: "Daily",

      // Placeholders
      noTasksYet: "No tasks yet",
      addTaskPlaceholder: "Add task...",

      // Common
      add: "Add",
      delete: "Delete",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",

      // Checklist Headings
      morning: "Morning",
      evening: "Evening",
      daily: "Daily",
      weekly: "Weekly",
      noTasksForToday: "No tasks for today",
    },
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const value = {
    language,
    changeLanguage,
    t,
    translations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

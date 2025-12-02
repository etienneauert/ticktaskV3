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
      frequentTasks: "Wiederkehrende Tasks",
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
      dailyShort: "Tägliche",
      weeklyShort: "Wöchentliche",

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
      general: "Einstellungen",
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

      // Finish Day
      finishDay: "Tag beenden",
      dayNotFinished: "Tag noch nicht fertig!",
      activeTasks: "aktive Task",
      activeTasksPlural: "aktive Tasks",

      // Popup
      enterTaskName: "Task-Name eingeben...",
      howMuchTime: "Wie viel Zeit brauchst du, um die Task zu erledigen?",
      min: "min",
      urgent: "Dringend",
      recurring: "Wiederkehrend",
      submit: "Absenden",

      // Login/Auth
      ticktaskLogin: "TickTask Login",
      ticktaskRegistration: "TickTask Registrierung",
      emailLabel: "E-Mail:",
      passwordLabel: "Passwort:",
      nameLabel: "Name:",
      confirmPasswordLabel: "Passwort bestätigen:",
      loggingIn: "Wird angemeldet...",
      registering: "Wird registriert...",
      signInWithGoogle: "Mit Google anmelden",
      googleSignInLoading: "Google-Anmeldung...",
      googleSignInCancelled: "Google-Anmeldung wurde abgebrochen",
      popupBlocked: "Popup wurde blockiert. Bitte erlaube Popups für diese Seite",
      googleSignInError: "Google-Anmeldung Fehler. Bitte versuche es erneut.",
      noUserFound: "Kein Benutzer mit dieser E-Mail gefunden",
      incorrectPassword: "Falsches Passwort",
      invalidEmail: "Ungültige E-Mail-Adresse",
      tooManyRequests: "Zu viele fehlgeschlagene Versuche. Bitte warte einen Moment",
      errorOccurred: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
      passwordsDoNotMatch: "Passwörter stimmen nicht überein",
      passwordTooShort: "Passwort muss mindestens 6 Zeichen lang sein",
      emailAlreadyInUse: "Diese E-Mail-Adresse wird bereits verwendet",
      passwordTooWeak: "Passwort ist zu schwach",
      registrationSuccessful: "Registrierung erfolgreich! Willkommen bei TickTask!",
      goToLogin: "Zum Login",
      guest: "Gast",

      // Info Popup
      info: "Info",
      ideaBehindTickTask: "Idea behind TickTask",
      ideaDescription: "Fokus statt Overload: TickTask hilft dir, Aufgaben schlank zu planen, einen Task nach dem anderen fertig zu machen und Routinen klar abzuschließen. Die App ist darauf ausgelegt, dich dabei zu unterstützen, produktiver zu werden ohne dabei überwältigt zu werden.",
      howItWorks: "How it works",
      createTasks: "Erstelle Tasks:",
      createTasksDesc: "Füge deine Aufgaben hinzu oder nutze Vorlagen (Frequent Tasks), die du regelmäßig benötigst.",
      timerSystem: "Timer-System:",
      timerSystemDesc: "Starte den Timer für einen Task – es läuft immer nur 1 Task parallel, damit du dich vollständig konzentrieren kannst.",
      routines: "Routinen:",
      routinesDesc: "Arbeite deine Routinen ab (Morning, Daily, Weekly, Abend) und halte deine Gewohnheiten aufrecht.",
      finishDayFeature: "Finish Day:",
      finishDayDesc: "Beende den Tag mit \"Finish Day\", wenn alle Aufgaben und Routinen abgeschlossen sind, um deinen Streak zu erhalten.",
      features: "Features",
      timeTracking: "Zeit-Tracking:",
      timeTrackingDesc: "Plane Zeit für jeden Task und verfolge, wie viel Zeit tatsächlich benötigt wurde.",
      priorities: "Prioritäten:",
      prioritiesDesc: "Markiere wichtige Tasks als \"Urgent\" für bessere Übersicht.",
      streakSystem: "Streak-System:",
      streakSystemDesc: "Halte deinen täglichen Produktivitäts-Streak am Laufen.",
      offlineFunctionality: "Offline-Funktionalität:",
      offlineFunctionalityDesc: "Funktioniert auch ohne Internetverbindung dank localStorage.",

      // Task Completion
      add5Min: "5 Min hinzufügen",
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
      frequentTasks: "Recurring Tasks",
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
      dailyShort: "Daily",
      weeklyShort: "Weekly",

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

      // Finish Day
      finishDay: "Finish Day",
      dayNotFinished: "Day not finished!",
      activeTasks: "active task",
      activeTasksPlural: "active tasks",

      // Popup
      enterTaskName: "Enter task name...",
      howMuchTime: "How much time do you need to complete the task?",
      min: "min",
      urgent: "Urgent",
      recurring: "Recurring",
      submit: "Submit",

      // Login/Auth
      ticktaskLogin: "TickTask Login",
      ticktaskRegistration: "TickTask Registration",
      emailLabel: "Email:",
      passwordLabel: "Password:",
      nameLabel: "Name:",
      confirmPasswordLabel: "Confirm Password:",
      loggingIn: "Logging in...",
      registering: "Registering...",
      signInWithGoogle: "Sign in with Google",
      googleSignInLoading: "Google Sign-In...",
      googleSignInCancelled: "Google Sign-In was cancelled",
      popupBlocked: "Popup was blocked. Please allow popups for this site",
      googleSignInError: "Google Sign-In error. Please try again.",
      noUserFound: "No user found with this email",
      incorrectPassword: "Incorrect password",
      invalidEmail: "Invalid email address",
      tooManyRequests: "Too many failed attempts. Please wait a moment",
      errorOccurred: "An error occurred. Please try again.",
      passwordsDoNotMatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 6 characters long",
      emailAlreadyInUse: "This email address is already in use",
      passwordTooWeak: "Password is too weak",
      registrationSuccessful: "Registration successful! Welcome to TickTask!",
      goToLogin: "Go to Login",
      guest: "Guest",

      // Info Popup
      info: "Info",
      ideaBehindTickTask: "Idea behind TickTask",
      ideaDescription: "Focus instead of overload: TickTask helps you plan tasks efficiently, complete one task at a time, and finish routines clearly. The app is designed to help you become more productive without being overwhelmed.",
      howItWorks: "How it works",
      createTasks: "Create Tasks:",
      createTasksDesc: "Add your tasks or use templates (Frequent Tasks) that you need regularly.",
      timerSystem: "Timer System:",
      timerSystemDesc: "Start the timer for a task – only 1 task runs at a time, so you can focus completely.",
      routines: "Routines:",
      routinesDesc: "Work through your routines (Morning, Daily, Weekly, Evening) and maintain your habits.",
      finishDayFeature: "Finish Day:",
      finishDayDesc: "End the day with \"Finish Day\" when all tasks and routines are completed to maintain your streak.",
      features: "Features",
      timeTracking: "Time Tracking:",
      timeTrackingDesc: "Plan time for each task and track how much time was actually needed.",
      priorities: "Priorities:",
      prioritiesDesc: "Mark important tasks as \"Urgent\" for better overview.",
      streakSystem: "Streak System:",
      streakSystemDesc: "Keep your daily productivity streak going.",
      offlineFunctionality: "Offline Functionality:",
      offlineFunctionalityDesc: "Works without internet connection thanks to localStorage.",

      // Task Completion
      add5Min: "Add 5 min",
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

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
    // Lade Sprache aus localStorage oder verwende Englisch als Standard (First Visit)
    const savedLanguage = localStorage.getItem("ticktask_language");
    return savedLanguage || "en";
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
      demoMode: "Demo-Modus",
      navTasks: "Tasks",
      navCalendar: "Kalender",
      navGoals: "Ziele",
      exampleTask: "Beispiel-Task",

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
      taskListEmpty: "Die Taskliste ist leer",

      // Timer
      done: "Fertig",
      pause: "Pause",
      play: "Abspielen",
      resetTimer: "Zurücksetzen",

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
      dailyRoutine: "Täglich",
      weeklyRoutine: "Wöchentlich",

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
      pleaseSelect: "Bitte wählen",
      today: "Heute",
      tomorrow: "Morgen",
      hour: "Stunde",
      minute: "Minute",
      previousDay: "Vorheriger Tag",
      nextDay: "Nächster Tag",

      // Checklist Headings
      morning: "Morgen",
      evening: "Abend",
      dailyChecklist: "Täglich",
      weeklyChecklist: "Wöchentlich",
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
      addTasksToMainList: "Tasks zur Hauptliste hinzufügen",
      scheduleTaskQuestion:
        "An welchem Tag und zu welcher Uhrzeit soll dieser Task ausgeführt werden?",
      assignGoal: "Ziel zuweisen",
      noGoal: "Kein Ziel",
      selectGoal: "Ziel auswählen",
      unnamedGoal: "Unbenanntes Ziel",

      // Goals
      goals: "Ziele",
      addGoalPlaceholder: "Ziel hinzufügen...",
      noGoalsDefined: "Noch keine Ziele definiert",
      deleteGoalTitle: "Ziel löschen?",
      goalReachedTitle: "Ziel erreicht?",
      createdLabel: "Erstellt:",
      targetLabel: "Ziel:",
      daysRemainingSuffix: "Tage verbleibend",
      daysOverdueSuffix: "Tage überfällig",
      goalReachedButton: "Ziel erreicht",
      showTasksForGoal: "Tasks anzeigen",
      hideTasksForGoal: "Tasks ausblenden",
      noWorkOnGoalYet: "An diesem Ziel wurde noch nicht gearbeitet",
      doneGoals: "Erledigte Ziele",

      // Calendar (Settings + WeekCalendar)
      startTime: "Startzeit:",
      endTime: "Endzeit:",
      visibility: "Sichtbarkeit:",
      show: "Einblenden",
      hide: "Ausblenden",
      startBeforeEndError: "Die Startzeit muss vor der Endzeit liegen!",
      addAppointment: "Termin hinzufügen",
      deleteAppointment: "Termin löschen",
      addRoutineAppointmentTitle: "Alltagstermin hinzufügen",
      appointmentNameLabel: "Name:",
      appointmentNamePlaceholder: "z.B. Fußballtraining, Schule",
      appointmentDefaultName: "Termin",
      selectDay: "Tag wählen",
      requiredFieldsAlert: "Bitte füllen Sie alle Pflichtfelder aus.",
      invalidEndTimeAlert: "Bitte wählen Sie eine gültige Endzeit.",
      endAfterStartAlert: "Die Endzeit muss nach der Startzeit liegen.",
      saveAppointmentErrorPrefix: "Fehler beim Speichern des Termins: ",
      legendTasks: "Tasks",
      legendRoutineAppointment: "Alltagstermin",
      everyDay: "Jeden Tag",
      weekdays: "Montag bis Freitag",
      // Welcome / Tutorial
      welcomeTitle: "Willkommen bei TickTask",
      welcomeP1:
        "TickTask ist deine persönliche Task-Management-App, die dir hilft, deine Aufgaben zu organisieren und produktiver zu werden.",
      welcomeP2:
        "Mit TickTask kannst du Aufgaben erstellen, Routinen planen, Ziele setzen und deinen Fortschritt verfolgen. Alles an einem Ort, einfach und übersichtlich.",
      welcomeP3:
        "Wir zeigen dir gleich die wichtigsten Funktionen, damit du sofort loslegen kannst!",
      skipTutorial: "Tutorial überspringen",
      startTutorial: "Tutorial starten",
      start: "Start",
      next: "Weiter",
      finish: "Beenden",
      // Tutorial step messages
      tutorialStepTaskInput:
        "Hier kannst du deine Tasks definieren. Gib einfach den Namen deines Tasks ein und klicke auf den Pfeil.",
      tutorialStepTaskPopup:
        "Anschließend kannst du deinen Task anpassen: Zeitdauer festlegen, Termin planen, als wichtig markieren oder einem Ziel zuweisen.",
      tutorialStepChecklist:
        "Mit diesem Stift-Icon kannst du deine Routinen und Checklisten anpassen.",
      tutorialStepAppointments:
        "Hier kannst du Alltagstermine hinzufügen, die regelmäßig stattfinden.",
      tutorialStepGoals: "Hier kannst du deine Ziele definieren, die du erreichen möchtest.",
      tutorialStepFinishDay:
        "Mit diesem Button kannst du den Tag beenden, wenn alle Aufgaben und Routinen abgeschlossen sind, um deinen Streak zu erhalten.",
      tutorialStepInfo:
        "Hier findest du weitere Informationen über die App und wie sie funktioniert.",
      // Date picker / Goals popup
      selectDate: "Datum auswählen",
      invalidDate: "Ungültiges Datum",
      dateInPast: "Datum liegt in der Vergangenheit",
      january: "Januar",
      february: "Februar",
      march: "März",
      april: "April",
      may: "Mai",
      june: "Juni",
      july: "Juli",
      august: "August",
      september: "September",
      october: "Oktober",
      november: "November",
      december: "Dezember",
      hoursNeeded: "Benötigte Stunden",
      hoursExamplePlaceholder: "z.B. 10",
      targetDate: "Zieldatum",
      priority: "Priorität",
      priorityLow: "Niedrig",
      priorityHigh: "Hoch",
      addGoal: "Ziel hinzufügen",

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
      ideaBehindTickTask: "Idee hinter TickTask",
      ideaDescription: "Fokus statt Overload: TickTask hilft dir, Aufgaben schlank zu planen, einen Task nach dem anderen fertig zu machen und Routinen klar abzuschließen. Die App ist darauf ausgelegt, dich dabei zu unterstützen, produktiver zu werden ohne dabei überwältigt zu werden.",
      howItWorks: "So funktioniert’s",
      createTasks: "Erstelle Tasks:",
      createTasksDesc: "Füge deine Aufgaben hinzu oder nutze Vorlagen (Frequent Tasks), die du regelmäßig benötigst.",
      timerSystem: "Timer-System:",
      timerSystemDesc: "Starte den Timer für einen Task – es läuft immer nur 1 Task parallel, damit du dich vollständig konzentrieren kannst.",
      routines: "Routinen:",
      routinesDesc: "Arbeite deine Routinen ab (Morning, Daily, Weekly, Abend) und halte deine Gewohnheiten aufrecht.",
      finishDayFeature: "Finish Day:",
      finishDayDesc: "Beende den Tag mit \"Finish Day\", wenn alle Aufgaben und Routinen abgeschlossen sind, um deinen Streak zu erhalten.",
      features: "Funktionen",
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
      demoMode: "Demo Mode",
      navTasks: "Tasks",
      navCalendar: "Calendar",
      navGoals: "Goals",
      exampleTask: "Example task",

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
      taskListEmpty: "The task list is empty",

      // Timer
      done: "Done",
      pause: "Pause",
      play: "Play",
      resetTimer: "Reset",

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
      dailyRoutine: "Daily",
      weeklyRoutine: "Weekly",

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
      pleaseSelect: "Please select",
      today: "Today",
      tomorrow: "Tomorrow",
      hour: "Hour",
      minute: "Minute",
      previousDay: "Previous day",
      nextDay: "Next day",

      // Checklist Headings
      morning: "Morning",
      evening: "Evening",
      dailyChecklist: "Daily",
      weeklyChecklist: "Weekly",
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
      addTasksToMainList: "Add tasks to main list",
      scheduleTaskQuestion:
        "On which day and at what time should this task be executed?",
      assignGoal: "Assign goal",
      noGoal: "No goal",
      selectGoal: "Select goal",
      unnamedGoal: "Unnamed goal",

      // Goals
      goals: "Goals",
      addGoalPlaceholder: "Add goal...",
      noGoalsDefined: "No goals defined yet",
      deleteGoalTitle: "Delete goal?",
      goalReachedTitle: "Goal reached?",
      createdLabel: "Created:",
      targetLabel: "Target:",
      daysRemainingSuffix: "days remaining",
      daysOverdueSuffix: "days overdue",
      goalReachedButton: "Goal reached",
      showTasksForGoal: "Show tasks",
      hideTasksForGoal: "Hide tasks",
      noWorkOnGoalYet: "No work has been done on this goal yet",
      doneGoals: "Done goals",

      // Calendar (Settings + WeekCalendar)
      startTime: "Start time:",
      endTime: "End time:",
      visibility: "Visibility:",
      show: "Show",
      hide: "Hide",
      startBeforeEndError: "Start time must be before end time!",
      addAppointment: "Add appointment",
      deleteAppointment: "Delete appointment",
      addRoutineAppointmentTitle: "Add routine appointment",
      appointmentNameLabel: "Name:",
      appointmentNamePlaceholder: "e.g. football training, school",
      appointmentDefaultName: "Appointment",
      selectDay: "Select day",
      requiredFieldsAlert: "Please fill in all required fields.",
      invalidEndTimeAlert: "Please choose a valid end time.",
      endAfterStartAlert: "End time must be after start time.",
      saveAppointmentErrorPrefix: "Error saving appointment: ",
      legendTasks: "Tasks",
      legendRoutineAppointment: "Routine appointment",
      everyDay: "Every day",
      weekdays: "Monday to Friday",
      // Welcome / Tutorial
      welcomeTitle: "Welcome to TickTask",
      welcomeP1:
        "TickTask is your personal task manager that helps you organize your tasks and become more productive.",
      welcomeP2:
        "With TickTask you can create tasks, plan routines, set goals, and track your progress — all in one place, simple and clear.",
      welcomeP3:
        "We’ll quickly show you the most important features so you can get started right away!",
      skipTutorial: "Skip tutorial",
      startTutorial: "Start tutorial",
      start: "Start",
      next: "Next",
      finish: "Finish",
      // Tutorial step messages
      tutorialStepTaskInput:
        "Here you can define your tasks. Just type the task name and click the arrow.",
      tutorialStepTaskPopup:
        "Then you can customize your task: set a duration, schedule it, mark it as important, or assign it to a goal.",
      tutorialStepChecklist:
        "With this pen icon you can customize your routines and checklists.",
      tutorialStepAppointments:
        "Here you can add routine appointments that happen regularly.",
      tutorialStepGoals: "Here you can define goals you want to achieve.",
      tutorialStepFinishDay:
        "With this button you can finish the day once all tasks and routines are completed to keep your streak.",
      tutorialStepInfo:
        "Here you can find more information about the app and how it works.",
      // Date picker / Goals popup
      selectDate: "Select date",
      invalidDate: "Invalid date",
      dateInPast: "Date is in the past",
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December",
      hoursNeeded: "Hours needed",
      hoursExamplePlaceholder: "e.g. 10",
      targetDate: "Target date",
      priority: "Priority",
      priorityLow: "Low",
      priorityHigh: "High",
      addGoal: "Add goal",

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

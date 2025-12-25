import { useState, useEffect } from "react";

// Helper to get this week's Monday (or any specific day index)
const getDayOfCurrentWeek = (dayIndex) => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (dayIndex - 1);
  const newDate = new Date(d.setDate(diff));
  // Keep the time safe? Using setDate modifies in place.
  // Actually, let's just return ISO string with current time but correct date.
  return newDate.toISOString();
};

const DEMO_DATA_VERSION = 12;

// Initial Demo Data
const INITIAL_DEMO_DATA = {
  dataVersion: DEMO_DATA_VERSION,
  tasks: [
    {
      id: "demo-1",
      text: "Complete expense report",
      urgent: true,
      done: false,
      taskDuration: 45,
      createdAt: { seconds: Date.now() / 1000 },
      frequent: false,
      goalId: null,
      scheduledDayOption: "monday",
      scheduledHour: 11,
      scheduledMinute: 0,
      scheduledDateTime: (function() {
        const d = new Date(getDayOfCurrentWeek(1)); // Monday
        d.setHours(11, 0, 0, 0);
        return d.toISOString();
      })(),
    },
    {
      id: "demo-2",
      text: "Clear email backlog",
      urgent: false,
      done: false,
      taskDuration: 30,
      createdAt: { seconds: Date.now() / 1000 },
      frequent: false,
      goalId: null,
      scheduledDayOption: "thursday",
      scheduledHour: 9,
      scheduledMinute: 0,
      scheduledDateTime: (function() {
        const d = new Date(getDayOfCurrentWeek(4)); // Thursday
        d.setHours(9, 0, 0, 0);
        return d.toISOString();
      })(),
    },
    {
      id: "demo-3",
      text: "Sort filing cabinet",
      urgent: true,
      done: false,
      taskDuration: 90,
      createdAt: { seconds: Date.now() / 1000 },
      frequent: false,
      goalId: null,
      scheduledDayOption: "wednesday",
      scheduledHour: 14,
      scheduledMinute: 30,
      scheduledDateTime: (function() {
        const d = new Date(getDayOfCurrentWeek(3)); // Wednesday
        d.setHours(14, 30, 0, 0);
        return d.toISOString();
      })(),
    },
    {
      id: "demo-4",
      text: "Prepare presentation slides",
      urgent: false,
      done: true,
      taskDuration: 60,
      actualTimeUsed: 55, // 55 mins used
      createdAt: { seconds: Date.now() / 1000 - 86400 },
      frequent: false,
      goalId: null,
      // Completed yesterday
      scheduledDayOption: null,
      scheduledHour: null,
      scheduledMinute: null,
      scheduledDateTime: null,
    },
    // Goal History Tasks
    {
      id: "demo-goal-task-1",
      text: "Study Chapter 1: Fundamentals",
      urgent: false,
      done: true,
      taskDuration: 120, // 2h
      actualTimeUsed: 120,
      createdAt: { seconds: Date.now() / 1000 - 172800 }, // 2 days ago
      frequent: false,
      goalId: "demo-goal-1", // Certification
      scheduledDayOption: null,
      scheduledHour: null,
      scheduledMinute: null,
      scheduledDateTime: null,
    },
    {
      id: "demo-goal-task-2",
      text: "Complete Mock Exam 1",
      urgent: true,
      done: true,
      taskDuration: 180, // 3h
      actualTimeUsed: 175,
      createdAt: { seconds: Date.now() / 1000 - 86400 }, // 1 day ago
      frequent: false,
      goalId: "demo-goal-1", // Certification
      scheduledDayOption: null,
      scheduledHour: null,
      scheduledMinute: null,
      scheduledDateTime: null,
    },
    {
      id: "demo-goal-task-3",
      text: "Study Chapter 2: Advanced Topics",
      urgent: false,
      done: true,
      taskDuration: 300, // 5h
      actualTimeUsed: 305, // slightly more
      createdAt: { seconds: Date.now() / 1000 - 43200 }, // 12 hours ago
      frequent: false,
      goalId: "demo-goal-1", // Certification
      scheduledDayOption: null,
      scheduledHour: null,
      scheduledMinute: null,
      scheduledDateTime: null,
    },
    {
      id: "demo-goal-task-4",
      text: "Long Sunday Run",
      urgent: false,
      done: true,
      taskDuration: 60, // 1h
      actualTimeUsed: 62,
      createdAt: { seconds: Date.now() / 1000 - 259200 }, // 3 days ago
      frequent: false,
      goalId: "demo-goal-2", // Fitness
      scheduledDayOption: null,
      scheduledHour: null,
      scheduledMinute: null,
      scheduledDateTime: null,
    },
    {
      id: "demo-goal-task-5",
      text: "Gym Session: Upper Body",
      urgent: false,
      done: true,
      taskDuration: 90, // 1.5h
      actualTimeUsed: 90,
      createdAt: { seconds: Date.now() / 1000 - 172800 }, // 2 days ago
      frequent: false,
      goalId: "demo-goal-2", // Fitness
      scheduledDayOption: null,
      scheduledHour: null,
      scheduledMinute: null,
      scheduledDateTime: null,
    },
    {
       id: "demo-goal-task-6",
       text: "Swimming Training",
       urgent: false,
       done: true,
       taskDuration: 150, // 2.5h
       actualTimeUsed: 148,
       createdAt: { seconds: Date.now() / 1000 - 86400 }, // 1 day ago
       frequent: false,
       goalId: "demo-goal-2", // Fitness
       scheduledDayOption: null,
       scheduledHour: null,
       scheduledMinute: null,
       scheduledDateTime: null,
    },
  ],
  frequentTemplates: [
    {
      id: "demo-freq-1",
      text: "Submit Weekly Timesheet",
      urgent: false,
      done: false,
      taskDuration: 15,
      createdAt: { seconds: Date.now() / 1000 },
      frequent: true,
      goalId: null,
      // Not scheduled in calendar, just available in list
      scheduledDayOption: null, 
      scheduledHour: null,
      scheduledMinute: null,
      scheduledDateTime: null,
    },
  ],
  appointments: [
    {
      id: "demo-apt-1",
      name: "Daily Standup",
      scheduledDayOption: "weekdays",
      scheduledHour: "10",
      scheduledMinute: "00",
      endHour: "10",
      endMinute: "30",
      scheduledDateTime: new Date().toISOString(), // Valid placeholder
      endDateTime: new Date(Date.now() + 1800000).toISOString(), // +30m
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-apt-2",
      name: "Lunch Break",
      scheduledDayOption: "everyday",
      scheduledHour: "13",
      scheduledMinute: "00",
      endHour: "14",
      endMinute: "00",
      scheduledDateTime: new Date().toISOString(), // Valid placeholder
      endDateTime: new Date(Date.now() + 3600000).toISOString(), // +1h
      createdAt: new Date().toISOString(),
    },
     {
      id: "demo-apt-3",
      name: "Gym",
      scheduledDayOption: "monday",
      scheduledHour: "18",
      scheduledMinute: "00",
      endHour: "19",
      endMinute: "30",
      scheduledDateTime: getDayOfCurrentWeek(1), // Monday
      endDateTime: new Date(Date.now() + 5400000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-apt-4",
      name: "Deep Focus Session",
      scheduledDayOption: "tuesday", // Specific day
      scheduledHour: "09",
      scheduledMinute: "00",
      endHour: "13",
      endMinute: "00",
      scheduledDateTime: getDayOfCurrentWeek(2), // Tuesday
      endDateTime: new Date(Date.now() + 14400000).toISOString(), // +4h (just needs to be valid)
      createdAt: new Date().toISOString(),
    },
    {
       id: "demo-apt-5",
       name: "Strategy Meeting",
       scheduledDayOption: "wednesday", // Specific day
       scheduledHour: "11",
       scheduledMinute: "00",
       endHour: "12",
       endMinute: "30",
       scheduledDateTime: getDayOfCurrentWeek(3), // Wednesday
       endDateTime: new Date(Date.now() + 5400000).toISOString(),
       createdAt: new Date().toISOString(),
    },
    {
      id: "demo-apt-6",
      name: "Design Workshop",
      scheduledDayOption: "friday", // Specific day
      scheduledHour: "14",
      scheduledMinute: "00",
      endHour: "17",
      endMinute: "00",
      scheduledDateTime: getDayOfCurrentWeek(5), // Friday
      endDateTime: new Date(Date.now() + 10800000).toISOString(), // +3h
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-apt-7",
      name: "Morning Routine",
      scheduledDayOption: "everyday",
      scheduledHour: "07",
      scheduledMinute: "00",
      endHour: "07",
      endMinute: "45",
      scheduledDateTime: new Date().toISOString(),
      endDateTime: new Date(Date.now() + 2700000).toISOString(), // +45m
      createdAt: new Date().toISOString(),
    },
     {
      id: "demo-apt-8",
      name: "Evening Routine",
      scheduledDayOption: "everyday",
      scheduledHour: "21",
      scheduledMinute: "30",
      endHour: "22",
      endMinute: "00",
      scheduledDateTime: new Date().toISOString(),
      endDateTime: new Date(Date.now() + 1800000).toISOString(), // +30m
      createdAt: new Date().toISOString(),
    },
  ],
  goals: [
    {
      id: "demo-goal-1",
      text: "Professional Certification",
      priority: "high",
      hoursNeeded: 40,
      timeSpent: 600, // 10 hours already spent (in minutes)
      targetDate: new Date(Date.now() + 2592000000).toISOString(), // +30 days
      createdAt: { seconds: Date.now() / 1000 },
    },
    {
      id: "demo-goal-2",
      text: "Improve Fitness Level",
      priority: "medium",
      hoursNeeded: 30,
      timeSpent: 300, // 5 hours
      targetDate: new Date(Date.now() + 7776000000).toISOString(), // +90 days
      createdAt: { seconds: Date.now() / 1000 },
    },
    {
       id: "demo-goal-3",
       text: "Read 12 Books",
       priority: "low",
       hoursNeeded: 20,
       timeSpent: 0,
       targetDate: new Date(Date.now() + 31536000000).toISOString(), // +1 year
       createdAt: { seconds: Date.now() / 1000 },
    },
  ],
  weeklyTasks: {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: ["Water plants"],
    sunday: [],
  },
  morningTasks: [
    "Drink a glass of water",
    "5 minute stretching",
    "Plan the day",
  ],
  abendTasks: [
    "Read 10 pages",
    "Prepare clothes for tomorrow",
  ],
  dailyTasks: [
    "Check emails",
  ],
  morningCompleted: new Set(["Plan the day"]),
  abendCompleted: new Set(),
  weeklyCompleted: new Set(),
  dailyCompleted: new Set(),
  streak: 3, // Start with a small streak to look encouraging
};

export const useGuestData = (isGuestMode) => {
  const [guestDataLoaded, setGuestDataLoaded] = useState(false);
  const [guestData, setGuestData] = useState(INITIAL_DEMO_DATA);

  useEffect(() => {
    if (isGuestMode) {
      setGuestDataLoaded(false);
      // Lade Gast-Daten aus localStorage
      const saved = localStorage.getItem("ticktask_guest_data");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          // DATA MIGRATION / VERSION CHECK
          if (!parsed.dataVersion || parsed.dataVersion < DEMO_DATA_VERSION) {
            console.log("Updating Demo Data to Version", DEMO_DATA_VERSION);
            setGuestData(INITIAL_DEMO_DATA);
            // Optional: Save immediately to persist upgrade logic, 
            // but updateGuestData handles save on next change.
            // Let's force save to ensure upgrade persists.
             const dataToSave = {
              ...INITIAL_DEMO_DATA,
              morningCompleted: Array.from(INITIAL_DEMO_DATA.morningCompleted),
              abendCompleted: Array.from(INITIAL_DEMO_DATA.abendCompleted),
              weeklyCompleted: Array.from(INITIAL_DEMO_DATA.weeklyCompleted),
              dailyCompleted: Array.from(INITIAL_DEMO_DATA.dailyCompleted),
            };
            localStorage.setItem("ticktask_guest_data", JSON.stringify(dataToSave));
            
            setGuestDataLoaded(true);
            return;
          }

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
          setGuestDataLoaded(true);
        } catch (e) {
          console.error("Failed to load guest data:", e);
          // Fallback to demo data on error
          setGuestData(INITIAL_DEMO_DATA);
          setGuestDataLoaded(true);
        }
      } else {
        // No saved data? Initialize with Demo Data!
        setGuestData(INITIAL_DEMO_DATA);
        setGuestDataLoaded(true);
      }
    } else {
      setGuestDataLoaded(false);
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
      // Reset to Demo Data instead of empty
      setGuestData(INITIAL_DEMO_DATA);
    }
  };

  return { guestData, guestDataLoaded, updateGuestData, clearGuestData };
};

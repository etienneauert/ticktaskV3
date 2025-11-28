import styles from "./WeekCalendar.module.css";
import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../../firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import plusSign from "../../assets/plus-sign.png";
import popupStyles from "./popup.module.css";
import trashBin from "../../assets/trash-bin.png";
import close2 from "../../assets/close-2.png";
import arrowDown from "../../assets/arrowdown-yellow.png";

const CELL_HEIGHT = 50;
const BAR_HEIGHT = 1;
const PX_PER_MINUTE = CELL_HEIGHT / 60;

const DAY_OPTIONS = [
  { value: "", label: "Bitte wählen" },
  { value: "today", label: "Heute" },
  { value: "tomorrow", label: "Morgen" },
  { value: "monday", label: "Montag" },
  { value: "tuesday", label: "Dienstag" },
  { value: "wednesday", label: "Mittwoch" },
  { value: "thursday", label: "Donnerstag" },
  { value: "friday", label: "Freitag" },
  { value: "saturday", label: "Samstag" },
  { value: "sunday", label: "Sonntag" },
];

const HOUR_OPTIONS = [
  { value: "", label: "Stunde" },
  ...Array.from({ length: 24 }, (_, i) => {
    const value = String(i).padStart(2, "0");
    return { value, label: value };
  }),
];

const MINUTE_OPTIONS = [
  { value: "", label: "Minute" },
  ...[0, 15, 30, 45].map((min) => {
    const value = String(min).padStart(2, "0");
    return { value, label: value };
  }),
];

function TransparentSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = useMemo(() => {
    const match = options.find((option) => option.value === value);
    return match ? match.label : placeholder;
  }, [options, placeholder, value]);

  return (
    <div
      ref={containerRef}
      className={`${popupStyles.transparentSelect} ${className}`}
    >
      {label && <span className={popupStyles.scheduleLabel}>{label}</span>}
      <button
        type="button"
        className={`${popupStyles.selectDisplay} ${
          open ? popupStyles.selectDisplayOpen : ""
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selectedLabel}</span>
        <span className={popupStyles.selectArrow}>
          <img src={arrowDown} alt="" className={popupStyles.selectArrowIcon} />
        </span>
      </button>
      {open && (
        <div className={popupStyles.selectDropdown}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value || "__empty"}
              className={`${popupStyles.selectOption} ${
                option.value === value ? popupStyles.selectOptionActive : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeekCalendar({ user, tasks = [] }) {
  const weekDays = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ];

  const [startHour, setStartHour] = useState(5); // Default: 05:00
  const [endHour, setEndHour] = useState(23); // Default: 23:00
  const [currentTime, setCurrentTime] = useState(new Date());
  const [popupOpen, setPopupOpen] = useState(false);
  const [appointmentName, setAppointmentName] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [appointmentEndHour, setAppointmentEndHour] = useState("");
  const [appointmentEndMinute, setAppointmentEndMinute] = useState("");
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!user?.uid) {
      // Im Gast-Modus: Standard verwenden
      setStartHour(5);
      setEndHour(23);
      return;
    }
    loadCalendarSettings();

    // Höre auf Änderungen der Kalender-Einstellungen
    const handleSettingsChange = (event) => {
      const { hours } = event.detail;
      const [start, end] = hours.split("-").map(Number);
      setStartHour(start);
      setEndHour(end);
    };

    window.addEventListener("calendarSettingsChanged", handleSettingsChange);

    return () => {
      window.removeEventListener(
        "calendarSettingsChanged",
        handleSettingsChange
      );
    };
  }, [user?.uid]);

  // Aktualisiere die aktuelle Zeit jede Minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    // Sofort aktualisieren
    updateTime();

    // Dann jede Minute aktualisieren
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadCalendarSettings = async () => {
    if (!user?.uid) return;

    try {
      // Versuche zuerst localStorage
      const localSettings = localStorage.getItem(
        `ticktask_calendar_hours_${user.uid}`
      );
      if (localSettings) {
        const [start, end] = localSettings.split("-").map(Number);
        setStartHour(start);
        setEndHour(end);
      }

      // Dann Firebase
      const settingsDoc = doc(db, "users", user.uid, "settings", "calendar");
      const settingsSnap = await getDoc(settingsDoc);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        const hours = data.hours || "5-23";
        const [start, end] = hours.split("-").map(Number);
        setStartHour(start);
        setEndHour(end);
        localStorage.setItem(`ticktask_calendar_hours_${user.uid}`, hours);
      }
    } catch (e) {
      console.error("Failed to load calendar settings", e);
    }
  };

  // Berechne Stunden basierend auf Einstellung
  const hours = useMemo(
    () =>
      Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour),
    [startHour, endHour]
  );

  const totalDayHeight =
    hours.length * CELL_HEIGHT + Math.max(0, hours.length - 1) * BAR_HEIGHT;

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Prüfe ob ein Datum der aktuelle Tag ist
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Berechne die Position des gelben Balkens für die aktuelle Zeit
  const getCurrentTimePosition = () => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    const adjustedDay = currentDay === 0 ? 6 : currentDay - 1; // Montag = 0, Sonntag = 6

    // Prüfe ob die aktuelle Zeit im sichtbaren Bereich liegt
    if (currentHour < startHour || currentHour > endHour) {
      return null;
    }

    // Berechne die vertikale Position
    const hourIndex = currentHour - startHour;
    const minutesInHour = currentMinute / 60;
    const cellHeight = 50; // Höhe einer Stunde in px
    const barHeight = 1; // Höhe der HorizontalBar zwischen Zeilen
    // Jede vollständige Stunde: cellHeight + barHeight (außer der letzten)
    // Für die Position innerhalb der aktuellen Stunde: nur cellHeight
    const topPosition =
      hourIndex * (cellHeight + barHeight) + minutesInHour * cellHeight;

    // Prüfe ob der aktuelle Tag in der angezeigten Woche liegt
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(
      today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)
    );
    weekStart.setHours(0, 0, 0, 0);

    const currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (currentDate - weekStart) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 0 || daysDiff > 6) {
      return null; // Nicht in der aktuellen Woche
    }

    return {
      top: topPosition,
      dayIndex: daysDiff,
    };
  };

  const timePosition = getCurrentTimePosition();

  const scheduledTasksByDay = useMemo(() => {
    if (!Array.isArray(tasks)) return {};

    return tasks
      .filter((task) => task?.scheduledDateTime)
      .map((task) => ({
        ...task,
        scheduledDate: new Date(task.scheduledDateTime),
      }))
      .filter((task) => !Number.isNaN(task.scheduledDate.getTime()))
      .reduce((acc, task) => {
        const key = task.scheduledDate.toDateString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {});
  }, [tasks]);

  const getTaskPosition = (task) => {
    if (!task?.scheduledDate) return null;
    const taskHour = task.scheduledDate.getHours();
    const taskMinute = task.scheduledDate.getMinutes();

    if (taskHour < startHour || taskHour > endHour) {
      return null;
    }

    const hourOffset = taskHour - startHour;
    const startOffset =
      hourOffset * (CELL_HEIGHT + BAR_HEIGHT) + taskMinute * PX_PER_MINUTE;

    const durationMinutes = parseInt(task.taskDuration, 10) || 0;
    const minHeight = CELL_HEIGHT * 0.5;
    const durationPx =
      durationMinutes > 0 ? durationMinutes * PX_PER_MINUTE : minHeight;
    const availableSpace = totalDayHeight - startOffset;

    if (availableSpace <= 0) {
      return null;
    }

    return {
      top: startOffset,
      height: Math.max(Math.min(durationPx, availableSpace), minHeight),
    };
  };

  const calculateScheduledDate = (dayOption, hour, minute) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);

    let targetDate = new Date(monday);

    if (dayOption === "today") {
      targetDate = new Date(today);
    } else if (dayOption === "tomorrow") {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 1);
    } else {
      const dayMap = {
        monday: 0,
        tuesday: 1,
        wednesday: 2,
        thursday: 3,
        friday: 4,
        saturday: 5,
        sunday: 6,
      };
      const dayIndex = dayMap[dayOption];
      if (dayIndex !== undefined) {
        targetDate.setDate(monday.getDate() + dayIndex);
      }
    }

    targetDate.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
    return targetDate;
  };

  const loadAppointments = async () => {
    if (!user?.uid) return;

    try {
      const appointmentsCol = collection(db, "users", user.uid, "appointments");
      const appointmentsQuery = query(
        appointmentsCol,
        orderBy("scheduledDateTime", "asc")
      );
      const appointmentsSnap = await getDocs(appointmentsQuery);
      const appointmentsData = appointmentsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Loaded appointments:", appointmentsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Failed to load appointments:", error);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadAppointments();
    }
  }, [user?.uid]);

  const appointmentsByDay = useMemo(() => {
    if (!Array.isArray(appointments)) return {};

    return appointments
      .filter((appointment) => appointment?.scheduledDateTime)
      .map((appointment) => ({
        ...appointment,
        scheduledDate: new Date(appointment.scheduledDateTime),
        endDate: appointment.endDateTime
          ? new Date(appointment.endDateTime)
          : null,
      }))
      .filter(
        (appointment) =>
          !Number.isNaN(appointment.scheduledDate.getTime()) &&
          appointment.endDate &&
          !Number.isNaN(appointment.endDate.getTime())
      )
      .reduce((acc, appointment) => {
        const key = appointment.scheduledDate.toDateString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(appointment);
        return acc;
      }, {});
  }, [appointments]);

  const getAppointmentPosition = (appointment) => {
    if (!appointment?.scheduledDateTime) return null;
    const startDate = new Date(appointment.scheduledDateTime);
    const endDate = appointment.endDateTime
      ? new Date(appointment.endDateTime)
      : null;

    if (!endDate) return null;

    const appointmentStartHour = startDate.getHours();
    const appointmentStartMinute = startDate.getMinutes();
    const appointmentEndHour = endDate.getHours();
    const appointmentEndMinute = endDate.getMinutes();

    if (appointmentStartHour < startHour || appointmentStartHour > endHour) {
      return null;
    }

    const startHourOffset = appointmentStartHour - startHour;
    const startOffset =
      startHourOffset * (CELL_HEIGHT + BAR_HEIGHT) +
      appointmentStartMinute * PX_PER_MINUTE;

    const durationMinutes =
      (appointmentEndHour - appointmentStartHour) * 60 +
      (appointmentEndMinute - appointmentStartMinute);
    const minHeight = CELL_HEIGHT * 0.5;
    const durationPx =
      durationMinutes > 0 ? durationMinutes * PX_PER_MINUTE : minHeight;
    const availableSpace = totalDayHeight - startOffset;

    if (availableSpace <= 0) {
      return null;
    }

    return {
      top: startOffset,
      height: Math.max(Math.min(durationPx, availableSpace), minHeight),
    };
  };

  const handleAddButtonClick = () => {
    setPopupOpen(true);
  };

  const handlePopupCancel = () => {
    setPopupOpen(false);
    setAppointmentName("");
    setSelectedDay("");
    setSelectedHour("");
    setSelectedMinute("");
    setAppointmentEndHour("");
    setAppointmentEndMinute("");
  };

  const handleSaveAppointment = async () => {
    if (
      !appointmentName.trim() ||
      !selectedDay ||
      !selectedHour ||
      !appointmentEndHour
    ) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const scheduledDate = calculateScheduledDate(
      selectedDay,
      selectedHour,
      selectedMinute
    );
    const endDate = calculateScheduledDate(
      selectedDay,
      appointmentEndHour,
      appointmentEndMinute
    );

    if (!user?.uid) {
      console.warn("User not logged in, cannot save appointment");
      handlePopupCancel();
      return;
    }

    try {
      const appointmentsCol = collection(db, "users", user.uid, "appointments");
      const appointmentData = {
        name: appointmentName.trim(),
        scheduledDateTime: scheduledDate.toISOString(),
        endDateTime: endDate.toISOString(),
        scheduledDayOption: selectedDay,
        scheduledHour: selectedHour,
        scheduledMinute: selectedMinute || "00",
        endHour: appointmentEndHour,
        endMinute: appointmentEndMinute || "00",
        createdAt: new Date().toISOString(),
      };
      console.log("Saving appointment:", appointmentData);
      await addDoc(appointmentsCol, appointmentData);
      console.log("Appointment saved successfully");
      await loadAppointments();
      handlePopupCancel();
    } catch (error) {
      console.error("Failed to save appointment:", error);
      alert("Fehler beim Speichern des Termins: " + error.message);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!user?.uid) return;

    try {
      const appointmentDocRef = doc(
        db,
        "users",
        user.uid,
        "appointments",
        appointmentId
      );
      await deleteDoc(appointmentDocRef);
      loadAppointments();
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    }
  };

  return (
    <div className={styles.WeekCalendar}>
      <div className={styles.CalendarHeader}>
        <div className={styles.LeftBar}></div>
        <div className={styles.TimeColumnHeader}>
          <button
            className={styles.AddButton}
            title="Termin hinzufügen"
            onClick={handleAddButtonClick}
          >
            <img src={plusSign} alt="Add" />
          </button>
        </div>
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`${styles.DayHeader} ${
              isToday(weekDates[index]) ? styles.DayHeaderToday : ""
            }`}
          >
            <div className={styles.DayName}>{day}</div>
            <div className={styles.DayDate}>
              {weekDates[index].getDate()}.
              {String(weekDates[index].getMonth() + 1).padStart(2, "0")}
            </div>
          </div>
        ))}
        <div className={styles.RightBar}></div>
      </div>
      <div className={styles.CalendarBody}>
        {timePosition && (
          <div
            className={styles.CurrentTimeIndicator}
            style={{
              top: `${timePosition.top}px`,
              gridColumn: `3 / 10`, // Spannt über alle 7 Tag-Spalten (Spalten 3-9)
            }}
          />
        )}
        <div className={styles.LeftBarColumn}>
          {hours.map((hour, index) => (
            <div key={hour}>
              <div className={styles.LeftBarCell}></div>
              {index < hours.length - 1 && (
                <div className={styles.HorizontalBar}></div>
              )}
            </div>
          ))}
        </div>
        <div className={styles.TimeColumn}>
          {hours.map((hour, index) => {
            const isCurrentHour =
              timePosition && currentTime.getHours() === hour;
            const currentMinute = currentTime.getMinutes();
            return (
              <div key={hour} className={styles.TimeRow}>
                <div
                  className={`${styles.TimeSlot} ${
                    isCurrentHour ? styles.TimeSlotCurrent : ""
                  }`}
                >
                  {isCurrentHour
                    ? `${String(hour).padStart(2, "0")}:${String(
                        currentMinute
                      ).padStart(2, "0")}`
                    : `${String(hour).padStart(2, "0")}:00`}
                </div>
                {index < hours.length - 1 && (
                  <div className={styles.HorizontalBar}></div>
                )}
              </div>
            );
          })}
        </div>
        {weekDays.map((day, dayIndex) => {
          const dayKey = weekDates[dayIndex].toDateString();
          const tasksForDay = scheduledTasksByDay[dayKey] || [];
          const sortedTasks = tasksForDay
            .slice()
            .sort(
              (a, b) =>
                a.scheduledDate - b.scheduledDate ||
                (a.text || "").localeCompare(b.text || "")
            );

          return (
            <div key={day} className={styles.DayColumn}>
              {hours.map((hour, index) => (
                <div key={`${day}-${hour}`} className={styles.CalendarRow}>
                  <div className={styles.CalendarCell}></div>
                  {index < hours.length - 1 && (
                    <div className={styles.HorizontalBar}></div>
                  )}
                </div>
              ))}
              <div className={styles.TasksOverlay}>
                {sortedTasks.map((task) => {
                  const positioning = getTaskPosition(task);
                  if (!positioning) return null;

                  const hour = task.scheduledDate.getHours();
                  const minutes = task.scheduledDate.getMinutes();
                  const formattedTime = `${String(hour).padStart(
                    2,
                    "0"
                  )}:${String(minutes).padStart(2, "0")}`;
                  const taskText = (task.text || "Task").trim() || "Task";
                  const approxWidthPx = Math.max(
                    100,
                    (positioning.width ?? 140) - 40
                  ); // subtract time/gap
                  const approxCharWidthPx = 6.5;
                  const estimatedTextWidth =
                    taskText.length * approxCharWidthPx;
                  const shouldScroll = estimatedTextWidth > approxWidthPx;
                  const scrollDurationSeconds = Math.min(
                    24,
                    Math.max(8, (estimatedTextWidth - approxWidthPx) / 4)
                  );

                  return (
                    <div
                      key={
                        task.id ||
                        `${formattedTime}-${task.text ?? "task"}-${
                          task.scheduledDateTime ?? ""
                        }`
                      }
                      className={styles.ScheduledTask}
                      style={{
                        top: `${positioning.top}px`,
                        height: `${positioning.height}px`,
                      }}
                    >
                      <span className={styles.ScheduledTaskTime}>
                        {formattedTime}
                      </span>
                      <span
                        className={`${styles.ScheduledTaskText} ${
                          shouldScroll ? styles.ScheduledTaskTextScrollable : ""
                        }`}
                      >
                        {shouldScroll ? (
                          <span
                            className={styles.ScheduledTaskTextInner}
                            style={{
                              animationDuration: `${scrollDurationSeconds}s`,
                            }}
                          >
                            <span>{taskText}</span>
                            <span aria-hidden="true">{taskText}</span>
                          </span>
                        ) : (
                          taskText
                        )}
                      </span>
                    </div>
                  );
                })}
                {(() => {
                  const appointmentsForDay = appointmentsByDay[dayKey] || [];
                  const sortedAppointments = appointmentsForDay
                    .slice()
                    .sort(
                      (a, b) =>
                        a.scheduledDate - b.scheduledDate ||
                        (a.name || "").localeCompare(b.name || "")
                    );

                  return sortedAppointments.map((appointment) => {
                    const positioning = getAppointmentPosition(appointment);
                    if (!positioning) return null;

                    const startHour = appointment.scheduledDate.getHours();
                    const startMinutes = appointment.scheduledDate.getMinutes();
                    const formattedTime = `${String(startHour).padStart(
                      2,
                      "0"
                    )}:${String(startMinutes).padStart(2, "0")}`;
                    const appointmentName =
                      (appointment.name || "Termin").trim() || "Termin";

                    return (
                      <div
                        key={appointment.id || appointment.scheduledDateTime}
                        className={styles.ScheduledAppointment}
                        style={{
                          top: `${positioning.top}px`,
                          height: `${positioning.height}px`,
                        }}
                      >
                        <span className={styles.ScheduledAppointmentTime}>
                          {formattedTime}
                        </span>
                        <span className={styles.ScheduledAppointmentText}>
                          {appointmentName}
                        </span>
                        <button
                          className={styles.AppointmentDeleteButton}
                          onClick={() =>
                            handleDeleteAppointment(appointment.id)
                          }
                          title="Termin löschen"
                        >
                          <img src={trashBin} alt="Delete" />
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          );
        })}
        <div className={styles.RightBarColumn}>
          {hours.map((hour, index) => (
            <div key={hour} className={styles.RightBarRow}>
              <div className={styles.RightBarCell}></div>
              {index < hours.length - 1 && (
                <div className={styles.HorizontalBar}></div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.BottomBar}>
        <div className={styles.BottomBarLeft}></div>
        <div className={styles.BottomBarTimeColumn}></div>
        {weekDays.map((day) => (
          <div key={day} className={styles.BottomBarCell}></div>
        ))}
        <div className={styles.BottomBarRight}></div>
      </div>

      {popupOpen && (
        <div className={popupStyles.overlay}>
          <div className={popupStyles.modal}>
            <div className={popupStyles.modalcloseandinfo}>
              <p></p>
              <img
                onClick={handlePopupCancel}
                className={popupStyles.close}
                src={close2}
                alt=""
              />
            </div>
            <div className={popupStyles.scheduleSection}>
              <h2>Alltagstermin hinzufügen</h2>
              <div className={popupStyles.scheduleInputs}>
                <div className={popupStyles.scheduleInput}>
                  <label className={popupStyles.scheduleLabel}>Name:</label>
                  <input
                    type="text"
                    value={appointmentName}
                    onChange={(e) => setAppointmentName(e.target.value)}
                    placeholder="z.B. Fußballtraining, Schule"
                    className={popupStyles.appointmentInput}
                  />
                </div>
                <TransparentSelect
                  label="Tag:"
                  value={selectedDay}
                  onChange={setSelectedDay}
                  options={DAY_OPTIONS}
                  placeholder="Bitte wählen"
                />
                <div className={popupStyles.scheduleInput}>
                  <label className={popupStyles.scheduleLabel}>
                    Start Uhrzeit:
                  </label>
                  <div className={popupStyles.timeInputs}>
                    <TransparentSelect
                      value={selectedHour}
                      onChange={setSelectedHour}
                      options={HOUR_OPTIONS}
                      placeholder="Stunde"
                      className={popupStyles.timeSelect}
                    />
                    <span className={popupStyles.timeSeparator}>:</span>
                    <TransparentSelect
                      value={selectedMinute}
                      onChange={setSelectedMinute}
                      options={MINUTE_OPTIONS}
                      placeholder="Minute"
                      className={popupStyles.timeSelect}
                    />
                  </div>
                </div>
                <div className={popupStyles.scheduleInput}>
                  <label className={popupStyles.scheduleLabel}>
                    End Uhrzeit:
                  </label>
                  <div className={popupStyles.timeInputs}>
                    <TransparentSelect
                      value={appointmentEndHour}
                      onChange={setAppointmentEndHour}
                      options={HOUR_OPTIONS}
                      placeholder="Stunde"
                      className={popupStyles.timeSelect}
                    />
                    <span className={popupStyles.timeSeparator}>:</span>
                    <TransparentSelect
                      value={appointmentEndMinute}
                      onChange={setAppointmentEndMinute}
                      options={MINUTE_OPTIONS}
                      placeholder="Minute"
                      className={popupStyles.timeSelect}
                    />
                  </div>
                </div>
              </div>
              <div className={popupStyles.actions}>
                <button
                  onClick={handleSaveAppointment}
                  className={popupStyles.addButton}
                  disabled={
                    !appointmentName.trim() ||
                    !selectedDay ||
                    !selectedHour ||
                    !appointmentEndHour
                  }
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

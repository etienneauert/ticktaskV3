import styles from "./popup.module.css";
import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../../firebase/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import close3 from "../../assets/close-3.png";
import dot3 from "../../assets/dot-3.png";
import starWhite from "../../assets/star-white.png";
import _play from "../../assets/play.png";
import _trashBin from "../../assets/trash-bin.png";
import plusSign from "../../assets/plus-sign.png";
import playgrey from "../../assets/play-grey.png";
import trashgrey from "../../assets/trash-grey.png";
import reloadneon from "../../assets/reloadneon.png";
import arrowDown from "../../assets/arrowdown-yellow.png";
import { useLanguage } from "../../contexts/LanguageContext";

// Options werden im Component per `t()` lokalisiert.

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5).map(
  (min) => {
    const value = String(min).padStart(2, "0");
    return { value, label: value };
  }
);

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

  const isPlaceholder = useMemo(() => {
    if (!value) return true;
    return !options.some((option) => option.value === value);
  }, [options, value]);

  return (
    <div
      ref={containerRef}
      className={`${styles.transparentSelect} ${className}`}
    >
      {label && <span className={styles.scheduleLabel}>{label}</span>}
      <button
        type="button"
        className={`${styles.selectDisplay} ${
          open ? styles.selectDisplayOpen : ""
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={isPlaceholder ? styles.selectPlaceholder : ""}>
          {selectedLabel}
        </span>
        <span className={styles.selectArrow}>
          <img src={arrowDown} alt="" className={styles.selectArrowIcon} />
        </span>
      </button>
      {open && (
        <div className={styles.selectDropdown}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value || "__empty"}
              className={`${styles.selectOption} ${
                option.value === value ? styles.selectOptionActive : ""
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

export default function Popup({
  open,
  onConfirm,
  onCancel,
  taskText,
  user,
  isTutorialMode = false,
  isGuestMode = false,
  updateGuestData,
  guestData,
}) {
  const { t } = useLanguage();
  const [urgent, setUrgent] = useState(false);
  const [taskDuration, setTaskDuration] = useState(0);
  const [frequent, setFrequent] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startHour, setStartHour] = useState(5);
  const [endHour, setEndHour] = useState(23);
  const [isShaking, setIsShaking] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [goals, setGoals] = useState([]);

  const dayOptions = useMemo(
    () => [
      { value: "today", label: t("today") },
      { value: "tomorrow", label: t("tomorrow") },
      { value: "monday", label: t("monday") },
      { value: "tuesday", label: t("tuesday") },
      { value: "wednesday", label: t("wednesday") },
      { value: "thursday", label: t("thursday") },
      { value: "friday", label: t("friday") },
      { value: "saturday", label: t("saturday") },
      { value: "sunday", label: t("sunday") },
    ],
    [t]
  );

  // Debug: Log props
  useEffect(() => {}, [isGuestMode, guestData, open]);

  // Reset state when popup opens
  useEffect(() => {
    if (open) {
      setUrgent(false);
      setTaskDuration(0);
      setFrequent(false);
      setIsRotating(false);
      setSelectedDay("");
      setSelectedHour("");
      setSelectedMinute("");
      setIsShaking(false);
      setSelectedGoal("");

      // Im Guest Mode: Lade Goals neu, wenn Popup geöffnet wird
      if (isGuestMode) {
        const saved = localStorage.getItem("ticktask_guest_data");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const guestGoals = parsed.goals || [];
            setGoals(guestGoals);
          } catch (e) {
            console.error("Popup: Failed to parse guest data on open", e);
          }
        } else {
          const guestGoals = guestData?.goals || [];
          setGoals(guestGoals);
        }
      }
    }
  }, [open, isGuestMode, guestData?.goals]);

  // Verhindere Body-Scroll wenn Popup offen ist (nur auf Desktop)
  useEffect(() => {
    if (open) {
      // Scrolling verhindern (auch auf Mobile)
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        // Stelle die Scroll-Position wieder her
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  // Lade Goals aus Firebase oder guestData
  useEffect(() => {
    if (isGuestMode) {
      // Im Guest Mode: Lade Goals aus guestData
      const loadGuestGoals = () => {
        // Versuche zuerst aus guestData prop
        let guestGoals = guestData?.goals || [];

        // Falls guestData leer ist, versuche localStorage
        if (guestGoals.length === 0) {
          const saved = localStorage.getItem("ticktask_guest_data");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              guestGoals = parsed.goals || [];
            } catch (e) {
              console.error("Popup: Failed to parse guest data", e);
            }
          }
        }

        setGoals(guestGoals);
      };

      loadGuestGoals();

      // Höre auch auf Goals-Änderungen im Guest Mode
      const handleGoalsChanged = () => {
        // Lade direkt aus localStorage, da guestData möglicherweise noch nicht aktualisiert ist
        const saved = localStorage.getItem("ticktask_guest_data");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const updatedGoals = parsed.goals || [];
            setGoals(updatedGoals);
          } catch (e) {
            console.error(
              "Popup: Failed to parse guest data from localStorage",
              e
            );
          }
        } else {
          // Falls localStorage leer ist, versuche guestData prop
          const guestGoals = guestData?.goals || [];
          setGoals(guestGoals);
        }
      };

      window.addEventListener("goalsChanged", handleGoalsChanged);
      return () => {
        window.removeEventListener("goalsChanged", handleGoalsChanged);
      };
    }

    const loadGoals = async () => {
      if (!user?.uid) {
        setGoals([]);
        return;
      }

      try {
        // Versuche zuerst localStorage
        const localGoals = localStorage.getItem(`ticktask_goals_${user.uid}`);
        if (localGoals) {
          const parsedGoals = JSON.parse(localGoals);
          setGoals(parsedGoals);
        }

        // Dann Firebase
        const goalsCol = collection(db, "users", user.uid, "goals");
        const goalsSnapshot = await getDocs(goalsCol);
        const goalsList = goalsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (goalsList.length > 0) {
          setGoals(goalsList);
          localStorage.setItem(
            `ticktask_goals_${user.uid}`,
            JSON.stringify(goalsList)
          );
        } else {
          setGoals([]);
          localStorage.removeItem(`ticktask_goals_${user.uid}`);
        }
      } catch (e) {
        console.error("Failed to load goals", e);
      }
    };

    loadGoals();

    // Höre auf Goals-Änderungen
    const handleGoalsChanged = () => {
      loadGoals();
    };

    window.addEventListener("goalsChanged", handleGoalsChanged);
    return () => {
      window.removeEventListener("goalsChanged", handleGoalsChanged);
    };
  }, [user?.uid, open, isGuestMode, guestData?.goals]);

  // Lade Kalender-Einstellungen
  useEffect(() => {
    const loadCalendarSettings = async () => {
      if (!user?.uid) {
        // Im Gast-Modus: Standard verwenden
        setStartHour(5);
        setEndHour(23);
        return;
      }

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

    loadCalendarSettings();
  }, [user?.uid]);

  // Generiere Stundenoptionen basierend auf Kalender-Einstellungen
  const HOUR_OPTIONS = useMemo(() => {
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => {
      const hour = i + startHour;
      const value = String(hour).padStart(2, "0");
      return { value, label: value };
    });
  }, [startHour, endHour]);

  // Aktualisiere die aktuelle Uhrzeit jede Minute
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

  const handleReload = () => {
    setTaskDuration(0);
    setIsRotating(true);
    // Reset rotation state after animation completes
    setTimeout(() => setIsRotating(false), 500);
  };

  const handleSubmit = () => {
    if (taskDuration === 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    onConfirm({
      urgent,
      taskDuration,
      frequent,
      scheduledDayOption: selectedDay,
      scheduledHour: selectedHour,
      scheduledMinute: selectedMinute,
      goalId: selectedGoal || null,
    });
  };

  const canSubmit =
    taskDuration > 0 &&
    // Wenn ein Tag ausgewählt ist, muss auch eine Uhrzeit ausgewählt sein
    (!selectedDay || selectedHour);

  // Generiere Goal-Optionen für das Dropdown
  const GOAL_OPTIONS = useMemo(() => {
    // Filtere nur nicht abgeschlossene Goals
    const activeGoals = goals.filter((goal) => !goal.completed);
    const options = [
      { value: "", label: t("noGoal") },
      ...activeGoals.map((goal) => ({
        value: goal.id,
        label: goal.text || goal.name || t("unnamedGoal"),
      })),
    ];
    return options;
  }, [goals, t]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div id="task-popup" className={`${styles.modal} ${styles.taskModal}`}>
        <div className={styles.modalcloseandinfo}>
          <p className={styles.currentTimeDisplay}>
            {String(currentTime.getHours()).padStart(2, "0")}:
            {String(currentTime.getMinutes()).padStart(2, "0")}
          </p>
          {!isTutorialMode && (
            <img
              onClick={onCancel}
              className={styles.close}
              src={close3}
              alt=""
            />
          )}
        </div>
        {/* <div className={styles.modalHeader}>
          <h1>Customize your task</h1>
        </div> */}

        {/* Demo Task Preview */}
        <div className={styles.demoPreview}>
          <div className={styles.demoTask}>
            <div className={styles.demoText}>
              {!urgent && (
                <img src={dot3} alt="" className={styles.regularIcon} />
              )}
              {urgent && (
                <img src={starWhite} alt="" className={styles.urgentIcon} />
              )}
              {taskText || t("enterTaskName")}
            </div>
            {taskDuration > 0 && (
              <div className={styles.demoTimer}>
                <div className={styles.demoCountdown}>{taskDuration}:00</div>
              </div>
            )}
            <div className={styles.playdelete}>
              <div className={styles.demoDelete}>
                <img src={playgrey} alt="" />
              </div>
              <div className={styles.demoDelete}>
                <img src={trashgrey} alt="" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.Duration}>
          <h2>{t("howMuchTime")}</h2>

          <div
            className={`${styles.durationButtons} ${
              isShaking ? styles.shake : ""
            }`}
          >
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 1)}
            >
              <img src={plusSign} alt="" />1 {t("min")}
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 5)}
            >
              <img src={plusSign} alt="" />5 {t("min")}
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 15)}
            >
              <img src={plusSign} alt="" />
              15 {t("min")}
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 30)}
            >
              <img src={plusSign} alt="" />
              30 {t("min")}
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 60)}
            >
              <img src={plusSign} alt="" />
              60 {t("min")}
            </button>

            <img
              className={`${styles.reload} ${
                isRotating ? styles.rotating : ""
              }`}
              onClick={handleReload}
              src={reloadneon}
              alt=""
            />
          </div>
        </div>
        <div className={styles.scheduleSection}>
          <h2>{t("scheduleTaskQuestion")}</h2>
          <div className={styles.scheduleInputs}>
            <TransparentSelect
              value={selectedDay}
              onChange={setSelectedDay}
              options={dayOptions}
              placeholder={t("selectDay")}
            />
            <TransparentSelect
              value={selectedHour}
              onChange={(val) => {
                setSelectedHour(val);
                if (val && !selectedMinute) {
                  setSelectedMinute("00");
                }
              }}
              options={HOUR_OPTIONS}
              placeholder={t("hour")}
              className={styles.timeSelect}
            />
            <span className={styles.timeSeparator}>:</span>
            <TransparentSelect
              value={selectedMinute}
              onChange={setSelectedMinute}
              options={MINUTE_OPTIONS}
              placeholder={t("minute")}
              className={styles.timeSelect}
            />
          </div>
        </div>

        <div className={styles.goalSection}>
          <h2>{t("assignGoal")}</h2>
          <TransparentSelect
            value={selectedGoal}
            onChange={setSelectedGoal}
            options={GOAL_OPTIONS}
            placeholder={t("selectGoal")}
          />
        </div>

        <div className={styles.checkboxes}>
          <div className={styles.Priority}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className={styles.checkboxInput}
              />
              <span className={styles.grey}>{t("urgent")}</span>
            </label>
          </div>

          <div className={styles.Recurring}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={frequent}
                onChange={(e) => setFrequent(e.target.checked)}
                className={styles.checkboxInput}
              />
              <span className={styles.grey}>{t("recurring")}</span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          {canSubmit ? (
            <button onClick={handleSubmit} className={styles.addButton}>
              {t("submit")}
            </button>
          ) : (
            <div className={styles.addButtonPlaceholder} aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

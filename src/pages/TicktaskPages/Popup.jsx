import styles from "./popup.module.css";
import { useState, useEffect, useMemo, useRef } from "react";
import close2 from "../../assets/close-2.png";
import dot3 from "../../assets/dot-3.png";
import starWhite from "../../assets/star-white.png";
import _play from "../../assets/play.png";
import _trashBin from "../../assets/trash-bin.png";
import plusSign from "../../assets/plus-sign.png";
import playgrey from "../../assets/play-grey.png";
import trashgrey from "../../assets/trash-grey.png";
import reloadneon from "../../assets/reloadneon.png";
import arrowDown from "../../assets/arrowdown-yellow.png";

const DAY_OPTIONS = [
  { value: "monday", label: "Montag" },
  { value: "tuesday", label: "Dienstag" },
  { value: "wednesday", label: "Mittwoch" },
  { value: "thursday", label: "Donnerstag" },
  { value: "friday", label: "Freitag" },
  { value: "saturday", label: "Samstag" },
  { value: "sunday", label: "Sonntag" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { value, label: value };
});

const MINUTE_OPTIONS = [0, 15, 30, 45].map((min) => {
  const value = String(min).padStart(2, "0");
  return { value, label: value };
});

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
        <span>{selectedLabel}</span>
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

export default function Popup({ open, onConfirm, onCancel, taskText }) {
  const [urgent, setUrgent] = useState(false);
  const [taskDuration, setTaskDuration] = useState(0);
  const [frequent, setFrequent] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

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
    }
  }, [open]);

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

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalcloseandinfo}>
          <p className={styles.currentTimeDisplay}>
            {String(currentTime.getHours()).padStart(2, "0")}:
            {String(currentTime.getMinutes()).padStart(2, "0")}
          </p>
          <img
            onClick={onCancel}
            className={styles.close}
            src={close2}
            alt=""
          />
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
              {taskText || "Enter task name..."}
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
          <h2>How much time do you need to complete the task?</h2>

          <div className={styles.durationButtons}>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 1)}
            >
              <img src={plusSign} alt="" />1 min
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 5)}
            >
              <img src={plusSign} alt="" />5 min
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 15)}
            >
              <img src={plusSign} alt="" />
              15 min
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 30)}
            >
              <img src={plusSign} alt="" />
              30 min
            </button>
            <button
              type="button"
              className={styles.durationBtn}
              onClick={() => setTaskDuration((prev) => prev + 60)}
            >
              <img src={plusSign} alt="" />
              60 min
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
          <h2>
            An welchem Tag und zu welcher Uhrzeit soll dieser Task ausgeführt
            werden?
          </h2>
          <div className={styles.scheduleInputs}>
            <TransparentSelect
              value={selectedDay}
              onChange={setSelectedDay}
              options={DAY_OPTIONS}
              placeholder="Tag wählen"
            />
            <TransparentSelect
              value={selectedHour}
              onChange={setSelectedHour}
              options={HOUR_OPTIONS}
              placeholder="Stunde"
              className={styles.timeSelect}
            />
            <span className={styles.timeSeparator}>:</span>
            <TransparentSelect
              value={selectedMinute}
              onChange={setSelectedMinute}
              options={MINUTE_OPTIONS}
              placeholder="Minute"
              className={styles.timeSelect}
            />
          </div>
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
              <span className={styles.grey}>Urgent</span>
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
              <span className={styles.grey}>Reccuring</span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() =>
              onConfirm({
                urgent,
                taskDuration,
                frequent,
                scheduledDayOption: selectedDay,
                scheduledHour: selectedHour,
                scheduledMinute: selectedMinute,
              })
            }
            className={styles.addButton}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

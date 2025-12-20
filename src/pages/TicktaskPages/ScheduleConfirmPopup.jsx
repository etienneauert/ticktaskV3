import styles from "./popup.module.css";
import { useState, useEffect, useRef, useMemo } from "react";
import close3 from "../../assets/close-3.png";
import arrowDown from "../../assets/arrowdown-yellow.png";
import { useLanguage } from "../../contexts/LanguageContext";

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

export default function ScheduleConfirmPopup({
  open,
  onConfirm,
  onCancel,
  taskText,
  initialUrgent = false,
}) {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");
  const [urgent, setUrgent] = useState(initialUrgent);
  const [shakeDay, setShakeDay] = useState(false);
  const [shakeHour, setShakeHour] = useState(false);
  const [shakeMinute, setShakeMinute] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedDay("");
      setSelectedHour("");
      setSelectedMinute("");
      setShakeDay(false);
      setShakeHour(false);
      setShakeMinute(false);
      setUrgent(initialUrgent);
    }
  }, [open, initialUrgent]);

  // Verhindere Body-Scroll, wenn das Popup offen ist (nur auf Desktop)
  useEffect(() => {
    if (open) {
      // Nur auf Desktop (>= 768px) Scrolling verhindern
      const isMobile = window.innerWidth < 768;
      
      if (!isMobile) {
        const scrollY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
          document.body.style.position = "";
          document.body.style.top = "";
          document.body.style.width = "";
          document.body.style.overflow = "";
          document.documentElement.style.overflow = "";
          window.scrollTo(0, scrollY);
        };
      }
    }
  }, [open]);

  if (!open) return null;

  const isAllFieldsFilled = selectedDay && selectedHour && selectedMinute;

  const handleWithSchedule = () => {
    if (!isAllFieldsFilled) {
      // Shake animation für nicht ausgefüllte Felder
      if (!selectedDay) {
        setShakeDay(true);
        setTimeout(() => setShakeDay(false), 500);
      }
      if (!selectedHour) {
        setShakeHour(true);
        setTimeout(() => setShakeHour(false), 500);
      }
      if (!selectedMinute) {
        setShakeMinute(true);
        setTimeout(() => setShakeMinute(false), 500);
      }
      return;
    }

    onConfirm(true, {
      scheduledDayOption: selectedDay || null,
      scheduledHour: selectedHour || null,
      scheduledMinute: selectedMinute || null,
      urgent,
    });
  };

  const handleWithoutSchedule = () => {
    onConfirm(false, { urgent });
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={`${styles.modal} ${styles.goalsModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img onClick={onCancel} className={styles.close} src={close3} alt="" />
        </div>
        <div className={styles.modalHeader}>
          <h1>{taskText}</h1>
        </div>
        <div className={styles.scheduleSection}>
          <h2>
            Soll für diesen Task ein bestimmter Tag und eine Uhrzeit ausgewählt
            werden?
          </h2>
          <div className={styles.scheduleInputs}>
            <TransparentSelect
              value={selectedDay}
              onChange={setSelectedDay}
              options={DAY_OPTIONS}
              placeholder="Tag wählen"
              className={shakeDay ? styles.shake : ""}
            />
            <TransparentSelect
              value={selectedHour}
              onChange={setSelectedHour}
              options={HOUR_OPTIONS}
              placeholder="Stunde"
              className={`${styles.timeSelect} ${shakeHour ? styles.shake : ""}`}
            />
            <span className={styles.timeSeparator}>:</span>
            <TransparentSelect
              value={selectedMinute}
              onChange={setSelectedMinute}
              options={MINUTE_OPTIONS}
              placeholder="Minute"
              className={`${styles.timeSelect} ${shakeMinute ? styles.shake : ""}`}
            />
          </div>
        </div>

        <div className={styles.checkboxes} style={{ marginTop: "5px" }}>
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
        </div>
        <div className={styles.actions}>
          {selectedDay || selectedHour || selectedMinute ? (
            <button
              onClick={handleWithSchedule}
              className={styles.addButton}
            >
              Mit Zeitplan hinzufügen
            </button>
          ) : (
            <button
              onClick={handleWithoutSchedule}
              className={styles.addButton}
            >
              Ohne Zeitplan hinzufügen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


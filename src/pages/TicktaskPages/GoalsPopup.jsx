import styles from "./popup.module.css";
import { useState, useEffect, useRef } from "react";
import close3 from "../../assets/close-3.png";
import arrowDown from "../../assets/arrowdown-yellow.png";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "../../contexts/LanguageContext";

function CustomDatePicker({ value, onChange, className = "" }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("day"); // "day", "month", "year"
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDay(date.getDate());
      setSelectedMonth(date.getMonth() + 1);
      setSelectedYear(date.getFullYear());
      // Validiere das Datum
      validateDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
    } else {
      setSelectedDay(null);
      setSelectedMonth(null);
      setSelectedYear(null);
      setIsInvalid(false);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setStep("day");
    } else {
      // Reset invalid state when picker opens
      setIsInvalid(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const formatDate = (dateString) => {
    if (!dateString) return t("selectDate");
    const date = new Date(dateString);
    try {
      return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US");
    } catch {
      return dateString;
    }
  };

  const validateDate = (day, month, year) => {
    if (!day || !month || !year) {
      setIsInvalid(false);
      return true;
    }
    const date = new Date(year, month - 1, day);
    const isValidDate =
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year;

    if (!isValidDate) {
      setIsInvalid(true);
      return false;
    }

    // Prüfe ob das Datum in der Vergangenheit liegt
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Setze Zeit auf Mitternacht für Vergleich
    const inputDate = new Date(year, month - 1, day);
    inputDate.setHours(0, 0, 0, 0);

    const isInPast = inputDate < today;
    setIsInvalid(isInPast);
    return !isInPast;
  };

  const getDisplayText = () => {
    if (isInvalid && selectedDay && selectedMonth && selectedYear) {
      const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      // Prüfe ob das Datum ungültig ist (z.B. 31.02) oder in der Vergangenheit
      const isValidDate =
        date.getDate() === selectedDay &&
        date.getMonth() === selectedMonth - 1 &&
        date.getFullYear() === selectedYear;

      if (!isValidDate) {
        return t("invalidDate");
      }
      if (date < today) {
        return t("dateInPast");
      }
      return t("invalidDate");
    }
    if (selectedDay && selectedMonth && selectedYear) {
      return formatDate(
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(
          selectedDay
        ).padStart(2, "0")}`
      );
    }
    if (selectedDay && selectedMonth) {
      return `${String(selectedDay).padStart(2, "0")}.${String(
        selectedMonth
      ).padStart(2, "0")}...`;
    }
    if (selectedDay) {
      return `${String(selectedDay).padStart(2, "0")}...`;
    }
    return t("selectDate");
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setIsInvalid(false); // Reset invalid state when user starts selecting new date
    setStep("month");
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setIsInvalid(false); // Reset invalid state when user starts selecting new date
    setStep("year");
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    // Alle Werte sind jetzt ausgewählt, validiere und erstelle das Datum
    const isValid = validateDate(selectedDay, selectedMonth, year);
    if (isValid) {
      const dateString = `${year}-${String(selectedMonth).padStart(
        2,
        "0"
      )}-${String(selectedDay).padStart(2, "0")}`;
      onChange(dateString);
      setIsOpen(false);
    } else {
      // Ungültiges Datum - zeige Fehlermeldung, aber schließe nicht
      setIsOpen(false);
    }
  };

  // Generiere Tage (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Generiere Monate
  const months = [
    { value: 1, label: t("january") },
    { value: 2, label: t("february") },
    { value: 3, label: t("march") },
    { value: 4, label: t("april") },
    { value: 5, label: t("may") },
    { value: 6, label: t("june") },
    { value: 7, label: t("july") },
    { value: 8, label: t("august") },
    { value: 9, label: t("september") },
    { value: 10, label: t("october") },
    { value: 11, label: t("november") },
    { value: 12, label: t("december") },
  ];

  // Generiere Jahre (aktuelles Jahr bis 10 Jahre in die Zukunft)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);

  const renderContent = () => {
    if (step === "day") {
      return (
        <div className={styles.datePickerDropdown}>
          {days.map((day) => (
            <button
              type="button"
              key={day}
              className={`${styles.datePickerOption} ${
                day === selectedDay ? styles.datePickerOptionActive : ""
              }`}
              onClick={() => handleDaySelect(day)}
            >
              {String(day).padStart(2, "0")}
            </button>
          ))}
        </div>
      );
    } else if (step === "month") {
      return (
        <div className={styles.datePickerDropdown}>
          {months.map((month) => (
            <button
              type="button"
              key={month.value}
              className={`${styles.datePickerOption} ${
                month.value === selectedMonth
                  ? styles.datePickerOptionActive
                  : ""
              }`}
              onClick={() => handleMonthSelect(month.value)}
            >
              {month.label}
            </button>
          ))}
        </div>
      );
    } else if (step === "year") {
      return (
        <div className={styles.datePickerDropdown}>
          {years.map((year) => (
            <button
              type="button"
              key={year}
              className={`${styles.datePickerOption} ${
                year === selectedYear ? styles.datePickerOptionActive : ""
              }`}
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </button>
          ))}
        </div>
      );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.customDatePicker} ${className}`}
    >
      <button
        type="button"
        className={`${styles.datePickerDisplay} ${
          isOpen ? styles.datePickerDisplayOpen : ""
        } ${!value ? styles.datePickerDisplayPlaceholder : ""} ${
          isInvalid ? styles.datePickerDisplayInvalid : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getDisplayText()}</span>
        <span className={styles.datePickerArrow}>
          <img src={arrowDown} alt="" className={styles.datePickerArrowIcon} />
        </span>
      </button>
      {isOpen && renderContent()}
    </div>
  );
}

export default function GoalsPopup({
  open,
  onConfirm,
  onCancel,
  goalText,
  user,
}) {
  const { t } = useLanguage();
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("low");
  const [hoursNeeded, setHoursNeeded] = useState("");

  // Reset state when popup opens
  useEffect(() => {
    if (open) {
      setTargetDate("");
      setPriority("low");
      setHoursNeeded("");
    }
  }, [open]);

  // Verhindere Body-Scroll wenn Popup offen ist (nur auf Desktop)
  useEffect(() => {
    if (open) {
      // Nur auf Desktop (>= 768px) Scrolling verhindern
      const isMobile = window.innerWidth < 768;

      if (!isMobile) {
        // Speichere die aktuelle Scroll-Position
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
    }
  }, [open]);

  const handleSubmit = () => {
    onConfirm({
      text: goalText,
      targetDate,
      priority,
      hoursNeeded: hoursNeeded ? parseFloat(hoursNeeded) : null,
    });
  };

  const canSubmit = Boolean(targetDate) && Boolean(hoursNeeded);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={`${styles.modal} ${styles.goalsModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img
            onClick={onCancel}
            className={styles.close}
            src={close3}
            alt=""
          />
        </div>

        {/* Goal Name Heading */}
        {goalText && <h1 className={styles.goalNameHeading}>{goalText}</h1>}

        {/* Hours Needed */}
        <div className={styles.scheduleSection}>
          <h2>{t("hoursNeeded")}</h2>
          <input
            type="text"
            className={styles.dateInput}
            value={hoursNeeded}
            onChange={(e) => {
              const value = e.target.value;
              // Erlaube nur Ziffern (0-9), keine Buchstaben oder Sonderzeichen
              if (value === "" || /^\d+$/.test(value)) {
                setHoursNeeded(value);
              }
            }}
            placeholder={t("hoursExamplePlaceholder")}
            inputMode="numeric"
          />
        </div>

        {/* Target Date */}
        <div className={styles.scheduleSection}>
          <h2>{t("targetDate")}</h2>
          <CustomDatePicker value={targetDate} onChange={setTargetDate} />
        </div>

        {/* Priority */}
        <div className={styles.scheduleSection}>
          <h2>{t("priority")}</h2>
          <div className={styles.priorityButtons}>
            <button
              type="button"
              className={`${styles.priorityButton} ${
                priority === "low" ? styles.priorityButtonActive : ""
              }`}
              onClick={() => setPriority("low")}
            >
              {t("priorityLow")}
            </button>
            <button
              type="button"
              className={`${styles.priorityButton} ${
                priority === "high" ? styles.priorityButtonActive : ""
              }`}
              onClick={() => setPriority("high")}
            >
              {t("priorityHigh")}
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          {canSubmit ? (
            <button onClick={handleSubmit} className={styles.addButton}>
              {t("addGoal")}
            </button>
          ) : (
            <div className={styles.addButtonPlaceholder} aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

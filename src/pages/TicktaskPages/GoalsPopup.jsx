import styles from "./popup.module.css";
import { useState, useEffect, useRef } from "react";
import close2 from "../../assets/close-2.png";
import arrowDown from "../../assets/arrow-down.png";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

function CustomDatePicker({ value, onChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("day"); // "day", "month", "year"
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDay(date.getDate());
      setSelectedMonth(date.getMonth() + 1);
      setSelectedYear(date.getFullYear());
    } else {
      setSelectedDay(null);
      setSelectedMonth(null);
      setSelectedYear(null);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setStep("day");
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
    if (!dateString) return "Datum auswählen";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getDisplayText = () => {
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
    return "Datum auswählen";
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setStep("month");
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setStep("year");
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    // Alle Werte sind jetzt ausgewählt, erstelle das Datum
    const dateString = `${year}-${String(selectedMonth).padStart(
      2,
      "0"
    )}-${String(selectedDay).padStart(2, "0")}`;
    onChange(dateString);
    setIsOpen(false);
  };

  // Generiere Tage (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Generiere Monate
  const months = [
    { value: 1, label: "Januar" },
    { value: 2, label: "Februar" },
    { value: 3, label: "März" },
    { value: 4, label: "April" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Dezember" },
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

  const handleSubmit = () => {
    onConfirm({
      text: goalText,
      targetDate,
      priority,
      hoursNeeded: hoursNeeded ? parseFloat(hoursNeeded) : null,
    });
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={`${styles.modal} ${styles.taskModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalcloseandinfo}>
          <p></p>
          <img
            onClick={onCancel}
            className={styles.close}
            src={close2}
            alt=""
          />
        </div>

        {/* Hours Needed */}
        <div className={styles.scheduleSection}>
          <h2>Benötigte Stunden</h2>
          <input
            type="number"
            className={styles.dateInput}
            value={hoursNeeded}
            onChange={(e) => setHoursNeeded(e.target.value)}
            placeholder="z.B. 10"
            min="0"
            step="0.5"
          />
        </div>

        {/* Target Date */}
        <div className={styles.scheduleSection}>
          <h2>Zieldatum</h2>
          <CustomDatePicker value={targetDate} onChange={setTargetDate} />
        </div>

        {/* Priority */}
        <div className={styles.scheduleSection}>
          <h2>Priorität</h2>
          <div className={styles.priorityButtons}>
            <button
              type="button"
              className={`${styles.priorityButton} ${
                priority === "low" ? styles.priorityButtonActive : ""
              }`}
              onClick={() => setPriority("low")}
            >
              Niedrig
            </button>
            <button
              type="button"
              className={`${styles.priorityButton} ${
                priority === "high" ? styles.priorityButtonActive : ""
              }`}
              onClick={() => setPriority("high")}
            >
              Hoch
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={handleSubmit} className={styles.addButton}>
            Goal hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

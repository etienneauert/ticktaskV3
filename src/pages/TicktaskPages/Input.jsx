import { useState } from "react";
import Popup from "./Popup";
import styles from "./Input.module.css";
import rightArrow2 from "../../assets/right-arrow-2.png";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Input({ onAdd }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    console.log("Submitting:", trimmed);
    setOpen(true);
  };

  const confirmAdd = (data) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd({
      text: trimmed,
      urgent: data.urgent,
      taskDuration: data.taskDuration,
      frequent: data.frequent,
      scheduledDayOption: data.scheduledDayOption || "",
      scheduledHour: data.scheduledHour || "",
      scheduledMinute: data.scheduledMinute || "",
    });
    setValue("");
    setOpen(false);
  };

  const cancelAdd = () => {
    setOpen(false);
  };
  return (
    <>
      <form className={styles.InputContainer} onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("addTaskPlaceholder")}
        />
        <button
          type="submit"
          className={`${styles.submitButton} ${
            value.trim() ? styles.submitButtonActive : ""
          }`}
        >
          <img src={rightArrow2} alt="" />
        </button>
      </form>
      <Popup
        open={open}
        onConfirm={confirmAdd}
        onCancel={cancelAdd}
        taskText={value}
      />
    </>
  );
}

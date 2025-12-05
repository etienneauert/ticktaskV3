import { useState } from "react";
import Popup from "./Popup";
import styles from "./Input.module.css";
import rightArrow2 from "../../assets/right-arrow-2.png";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Input({
  onAdd,
  user,
  tutorialPopupOpen,
  onTutorialPopupClose,
  isTutorialMode = false,
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
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
      goalId: data.goalId || null,
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
          id="task-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("addTaskPlaceholder")}
          className={isShaking ? styles.shake : ""}
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
        open={open || tutorialPopupOpen}
        onConfirm={confirmAdd}
        onCancel={tutorialPopupOpen ? onTutorialPopupClose : cancelAdd}
        taskText={value || "Beispiel Task"}
        user={user}
        isTutorialMode={tutorialPopupOpen}
      />
    </>
  );
}

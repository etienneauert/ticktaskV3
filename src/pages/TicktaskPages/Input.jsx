import { useState } from "react";
import Popup from "./Popup";
import styles from "./Input.module.css";
import rightArrow2 from "../../assets/right-arrow-2.png";

export default function Input({ onAdd, task }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
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
          placeholder="Enter new Task..."
        />
        <button type="submit" className={styles.submitButton}>
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

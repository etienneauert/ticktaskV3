import { useState } from "react";
import styles from "./Goals.module.css";
import rightArrow2 from "../../assets/right-arrow-2.png";
import GoalsPopup from "./GoalsPopup";

export default function Goals({ user }) {
  const [value, setValue] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setOpen(true);
  };

  const confirmAdd = (data) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    // TODO: Goal speichern
    console.log("Goal hinzugefügt:", data);
    setValue("");
    setOpen(false);
  };

  const cancelAdd = () => {
    setOpen(false);
  };

  return (
    <>
      <div className={styles.GoalsContainer}>
        <h3 className={styles.GoalsTitle}>Goals</h3>
        <form className={styles.GoalsInputContainer} onSubmit={handleSubmit}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Goal hinzufügen..."
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
      </div>
      <GoalsPopup
        open={open}
        onConfirm={confirmAdd}
        onCancel={cancelAdd}
        goalText={value}
        user={user}
      />
    </>
  );
}

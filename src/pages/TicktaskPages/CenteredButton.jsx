import styles from "./CenteredButton.module.css";

export default function CenteredButton({
  onClick,
  children,
  className = "",
  disabled = false,
}) {
  return (
    <div className={styles.container}>
      <button
        className={`${styles.centeredButton} ${className} ${
          disabled ? styles.disabled : ""
        }`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    </div>
  );
}

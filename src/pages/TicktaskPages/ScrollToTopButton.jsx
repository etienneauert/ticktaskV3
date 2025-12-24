import { useEffect, useState } from "react";
import styles from "./ScrollToTopButton.module.css";

export default function ScrollToTopButton({ showAfterPx = 240 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setVisible(y > showAfterPx);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfterPx]);

  if (!visible) return null;

  return (
    <button
      type="button"
      className={styles.button}
      aria-label="Nach oben"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span className={styles.arrow} />
    </button>
  );
}




import styles from "./WelcomePopup.module.css";
import { useEffect } from "react";

export default function WelcomePopup({ open, onClose, onStartTutorial }) {
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

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h1>Willkommen bei Ticktask</h1>
        </div>

        <div className={styles.content}>
          <p>
            Ticktask ist deine persönliche Task-Management-App, die dir hilft,
            deine Aufgaben zu organisieren und produktiver zu werden.
          </p>
          <p>
            Mit Ticktask kannst du Aufgaben erstellen, Routinen planen, Ziele
            setzen und deinen Fortschritt verfolgen. Alles an einem Ort, einfach
            und übersichtlich.
          </p>
          <p>
            Wir zeigen dir gleich die wichtigsten Funktionen, damit du sofort
            loslegen kannst!
          </p>
        </div>

        <div className={styles.buttonContainer}>
          <button
            className={styles.skipButton}
            onClick={onClose}
          >
            Skip Tutorial
          </button>
          <button
            className={styles.startButton}
            onClick={() => {
              if (onStartTutorial) {
                onStartTutorial();
              } else {
                onClose();
              }
            }}
          >
            Start Tutorial
          </button>
        </div>
      </div>
    </div>
  );
}


import styles from "./WelcomePopup.module.css";
import { useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function WelcomePopup({ open, onClose, onStartTutorial }) {
  const { t } = useLanguage();
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
          <h1>{t("welcomeTitle")}</h1>
        </div>

        <div className={styles.content}>
          <p>{t("welcomeP1")}</p>
          <p>{t("welcomeP2")}</p>
          <p>{t("welcomeP3")}</p>
        </div>

        <div className={styles.buttonContainer}>
          <button className={styles.skipButton} onClick={onClose}>
            {t("skipTutorial")}
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
            {t("startTutorial")}
          </button>
          <button className={styles.startButtonSmall} onClick={onClose}>
            {t("start")}
          </button>
        </div>
      </div>
    </div>
  );
}

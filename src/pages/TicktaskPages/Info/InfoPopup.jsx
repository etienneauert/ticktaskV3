import styles from "./InfoPopup.module.css";
import close from "../../../assets/close-2.png";

export default function InfoPopup({ open, onClose }) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalcloseandinfo}>
          <h1 className={styles.title}>Info</h1>
          <img
            onClick={onClose}
            className={styles.closeButton}
            src={close}
            alt=""
          />
        </div>
        <div className={styles.content}>
          <section className={styles.section}>
            <h3>Idea behind TickTask</h3>
            <p>
              Fokus statt Overload: TickTask hilft dir, Aufgaben schlank zu
              planen, einen Task nach dem anderen fertig zu machen und Routinen
              klar abzuschließen. Die App ist darauf ausgelegt, dich dabei zu
              unterstützen, produktiver zu werden ohne dabei überwältigt zu
              werden.
            </p>
          </section>

          <section className={styles.section}>
            <h4>How it works</h4>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.bullet}>•</span>
                <p>
                  <strong>Erstelle Tasks:</strong> Füge deine Aufgaben hinzu oder
                  nutze Vorlagen (Frequent Tasks), die du regelmäßig benötigst.
                </p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.bullet}>•</span>
                <p>
                  <strong>Timer-System:</strong> Starte den Timer für einen
                  Task – es läuft immer nur 1 Task parallel, damit du dich
                  vollständig konzentrieren kannst.
                </p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.bullet}>•</span>
                <p>
                  <strong>Routinen:</strong> Arbeite deine Routinen ab (Morning,
                  Daily, Weekly, Abend) und halte deine Gewohnheiten aufrecht.
                </p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.bullet}>•</span>
                <p>
                  <strong>Finish Day:</strong> Beende den Tag mit "Finish Day",
                  wenn alle Aufgaben und Routinen abgeschlossen sind, um deinen
                  Streak zu erhalten.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h4>Features</h4>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.bullet}>•</span>
                <p>
                  <strong>Zeit-Tracking:</strong> Plane Zeit für jeden Task und
                  verfolge, wie viel Zeit tatsächlich benötigt wurde.
                </p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.bullet}>•</span>
                <p>
                  <strong>Prioritäten:</strong> Markiere wichtige Tasks als
                  "Urgent" für bessere Übersicht.
                </p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.bullet}>•</span>
                <p>
                  <strong>Streak-System:</strong> Halte deinen täglichen
                  Produktivitäts-Streak am Laufen.
                </p>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.bullet}>•</span>
                <p>
                  <strong>Offline-Funktionalität:</strong> Funktioniert auch
                  ohne Internetverbindung dank localStorage.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import styles from "./TutorialTooltip.module.css";

export default function TutorialTooltip({
  targetId,
  message,
  position = "top",
  onNext,
  onSkip,
  showNext = false,
  showSkip = false,
  maxWidth = 400,
}) {
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowPosition, setArrowPosition] = useState("50%");
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    if (!targetId) return;

    const updatePosition = () => {
      // Verhindere mehrfache Updates während der Berechnung (Debouncing)
      if (updatePosition.isUpdating) return;
      updatePosition.isUpdating = true;

      // Setze Flag nach kurzer Zeit zurück
      setTimeout(() => {
        updatePosition.isUpdating = false;
      }, 50);

      // Suche nach dem Ziel-Element
      let targetElement = document.getElementById(targetId);

      if (!targetElement) {
        // Wenn Element nicht gefunden, versuche es nach kurzer Verzögerung erneut
        setTimeout(updatePosition, 100);
        return;
      }

      const rect = targetElement.getBoundingClientRect();

      // Position basierend auf position prop
      if (position === "left") {
        // Rechts neben dem Element - Tooltip rechts vom Popup
        // Pfeil an der linken Seite des Tooltips, zeigt nach links zum Popup
        const top = rect.top + rect.height * 0.5; // Weiter unten am Popup (85% der Höhe)
        const left = rect.right + 20; // 20px Abstand rechts vom Popup

        setTooltipStyle({
          top: `${top}px`,
          left: `${left}px`,
          transform: "translateY(0)", // Keine vertikale Zentrierung
        });
      } else if (position === "top") {
        // Position unter dem Element (top)
        const top = rect.bottom + 20; // 20px Abstand
        const tooltipMaxWidth = maxWidth; // max-width des Tooltips
        const minMargin = 20; // Mindestabstand vom Rand

        // WICHTIG: Berechne die Mitte des Ziel-Elements genau
        const targetCenter = rect.left + rect.width / 2;

        // Berechne die verfügbare Breite
        const availableWidth = window.innerWidth - minMargin * 2;
        // Für Info-Button: Verwende immer die feste maxWidth, nicht die verfügbare Breite
        const actualTooltipWidth =
          targetId === "info-button"
            ? tooltipMaxWidth
            : Math.min(tooltipMaxWidth, availableWidth);

        // Deklariere Variablen für Tooltip-Positionierung
        let left;
        let tooltipLeftEdge;
        let arrowOffset;

        // Normale Positionierung für alle Elemente (inkl. Info-Button)
        // Versuche, das Tooltip zentriert über dem Ziel zu positionieren
        left = targetCenter;

        // Berechne die Ränder des Tooltips (vor transform)
        // WICHTIG: Mit transform: translateX(-50%) ist die linke Kante bei left - actualTooltipWidth / 2
        tooltipLeftEdge = left - actualTooltipWidth / 2;
        const tooltipRightEdge = left + actualTooltipWidth / 2;

        // Prüfe, ob das Tooltip links außerhalb des Viewports wäre
        if (tooltipLeftEdge < minMargin) {
          // Tooltip zu weit links, verschiebe es nach rechts
          left = actualTooltipWidth / 2 + minMargin;
          tooltipLeftEdge = left - actualTooltipWidth / 2; // Aktualisiere tooltipLeftEdge
        }
        // Prüfe, ob das Tooltip rechts außerhalb des Viewports wäre
        else if (tooltipRightEdge > window.innerWidth - minMargin) {
          // Tooltip zu weit rechts, verschiebe es nach links
          left = window.innerWidth - actualTooltipWidth / 2 - minMargin;
          tooltipLeftEdge = left - actualTooltipWidth / 2; // Aktualisiere tooltipLeftEdge
        }

        // Berechne die Pfeil-Position basierend auf der Position des Ziel-Elements
        // Nach transform: translateX(-50%) ist die linke Kante des Tooltips bei left - actualTooltipWidth / 2
        // Der Pfeil soll auf targetCenter zeigen
        // arrowOffset = targetCenter - tooltipLeftEdge
        // tooltipLeftEdge = left - actualTooltipWidth / 2
        // arrowOffset = targetCenter - (left - actualTooltipWidth / 2)

        // Für Info-Button: Pfeil soll immer genau in der Mitte sein (50% der Breite)
        // Das Tooltip hat eine feste Breite von 220px (durch CSS-Klasse)
        // Der Pfeil soll genau in der Mitte sein, unabhängig von der Positionierung
        if (targetId === "info-button") {
          // Für Info-Button: Pfeil immer genau in der Mitte
          // Verwende die feste maxWidth (220px), nicht actualTooltipWidth
          arrowOffset = tooltipMaxWidth / 2;
        } else {
          arrowOffset = targetCenter - tooltipLeftEdge;

          // Stelle sicher, dass arrowOffset definiert ist
          if (arrowOffset === undefined) {
            arrowOffset = targetCenter - tooltipLeftEdge;
          }

          // Stelle sicher, dass der Pfeil innerhalb des Tooltips bleibt (mit etwas Abstand zu den Rändern)
          const minArrowOffset = 20; // Mindestabstand vom linken Rand des Tooltips
          const maxArrowOffset = actualTooltipWidth - 20; // Mindestabstand vom rechten Rand

          // Clamp arrowOffset
          arrowOffset = Math.max(
            minArrowOffset,
            Math.min(arrowOffset, maxArrowOffset)
          );
        }

        // Für Info-Button: Verwende Prozent-Wert für den Pfeil (immer 50% = Mitte)
        // Für andere: Verwende Pixel-Wert
        const arrowLeft =
          targetId === "info-button" ? "50%" : `${arrowOffset}px`;

        setTooltipStyle({
          top: `${top}px`,
          left: `${left}px`,
          transform: "translateX(-50%)", // Horizontal zentrieren
          // Für Info-Button: Verwende width statt maxWidth für feste Breite
          ...(targetId === "info-button"
            ? {
                width: `${tooltipMaxWidth}px`,
                maxWidth: `${tooltipMaxWidth}px`,
              }
            : { maxWidth: `${actualTooltipWidth}px` }),
        });
        // Speichere die Pfeil-Position separat
        setArrowPosition(arrowLeft);
        // Markiere als positioniert
        setIsPositioned(true);
      }
    };

    // Initial position mit Verzögerung, damit DOM-Elemente gerendert sind
    // Verwende mehrere requestAnimationFrame für eine flüssigere Positionierung
    let rafId1, rafId2, rafId3;

    // Erste Positionierung nach kurzer Verzögerung
    rafId1 = requestAnimationFrame(() => {
      setTimeout(() => {
        updatePosition();
        // Zweite Positionierung nach weiteren Frames
        rafId2 = requestAnimationFrame(() => {
          setTimeout(() => {
            updatePosition();
            // Dritte Positionierung für finale Korrektur
            rafId3 = requestAnimationFrame(() => {
              setTimeout(updatePosition, 50);
            });
          }, 50);
        });
      }, 100);
    });

    // Update on scroll and resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    // Update when content changes
    const observer = new MutationObserver(updatePosition);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    return () => {
      if (rafId1) cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      if (rafId3) cancelAnimationFrame(rafId3);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      observer.disconnect();
    };
  }, [targetId, position]);

  if (!targetId) return null;

  // Kombiniere tooltipStyle mit maxWidth
  // Wenn width gesetzt ist (z.B. für Info-Button), verwende diese statt maxWidth
  const finalStyle = {
    ...tooltipStyle,
    ...(tooltipStyle.width
      ? {} // width hat bereits Priorität, kein maxWidth hinzufügen
      : {
          maxWidth: tooltipStyle.maxWidth
            ? tooltipStyle.maxWidth
            : `${maxWidth}px`,
        }),
  };

  // Berechne arrowStyle basierend auf arrowPosition
  const arrowStyle =
    position === "top"
      ? {
          left: arrowPosition,
          transform: "translateX(-50%)",
        }
      : {};

  // Verstecke das Tooltip, bis es korrekt positioniert ist
  const displayStyle = isPositioned ? {} : { opacity: 0, visibility: "hidden" };

  return (
    <div
      className={`${styles.tooltip} ${
        targetId === "info-button" ? styles.infoButtonTooltip : ""
      }`}
      style={{ ...finalStyle, ...displayStyle }}
      data-position={position}
    >
      <div
        className={styles.arrow}
        data-position={position}
        style={arrowStyle}
      ></div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        {(showNext || showSkip) && (
          <div className={styles.buttons}>
            {showNext && (
              <button className={styles.nextButton} onClick={onNext}>
                Weiter
              </button>
            )}
            {showSkip && (
              <button className={styles.continueButton} onClick={onNext}>
                Weiter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

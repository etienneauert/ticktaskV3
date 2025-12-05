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

      // Für Info-Button: Finde das richtige Element durch Suche nach dem Button mit img vor dem Abmelden-Button
      let targetElement;
      if (targetId === "info-button") {
        // Suche alle Buttons im Header-Bereich
        const buttonsRight =
          document.querySelector(".buttonsRight") ||
          document.querySelector('[class*="buttonsRight"]');
        let allButtons = [];

        if (buttonsRight) {
          allButtons = Array.from(buttonsRight.querySelectorAll("button"));
        } else {
          // Fallback: Suche in header und headerContainer
          allButtons = Array.from(
            document.querySelectorAll("header button, .headerContainer button")
          );
        }

        // Finde den Abmelden-Button (hat Text "Abmelden" oder "logout")
        const abmeldenButton = allButtons.find((btn) => {
          const text = btn.textContent?.trim() || "";
          return (
            text.toLowerCase().includes("abmelden") ||
            text.toLowerCase().includes("logout")
          );
        });

        // WICHTIG: Suche direkt nach Button mit id="info-button" (das ist der Info-Button)
        const byId = document.getElementById("info-button");
        if (byId) {
          const img = byId.querySelector("img");
          const text = byId.textContent?.trim() || "";
          const hasAbmeldenText =
            text.toLowerCase().includes("abmelden") ||
            text.toLowerCase().includes("logout");
          // Stelle sicher, dass es nicht der Settings-Button ist (Settings-Button hat kein id="info-button")
          // Der Info-Button hat id="info-button" UND ein img-Element
          if (byId.id === "info-button" && img && !hasAbmeldenText) {
            targetElement = byId;
          }
        }

        // Fallback: Suche nach Button direkt vor dem Abmelden-Button mit id="info-button"
        if (!targetElement && abmeldenButton) {
          const abmeldenIndex = allButtons.indexOf(abmeldenButton);
          if (abmeldenIndex > 0) {
            const possibleInfoButton = allButtons[abmeldenIndex - 1];
            // Prüfe, ob es der Button mit id="info-button" ist
            if (possibleInfoButton && possibleInfoButton.id === "info-button") {
              targetElement = possibleInfoButton;
            }
          }
        }

        // Letzter Fallback: Verwende getElementById
        if (!targetElement) {
          targetElement = document.getElementById(targetId);
        }
      } else {
        targetElement = document.getElementById(targetId);
      }

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
        const actualTooltipWidth = Math.min(tooltipMaxWidth, availableWidth);

        // Versuche, das Tooltip zentriert über dem Ziel zu positionieren
        let left = targetCenter;

        // Berechne die Ränder des Tooltips (vor transform)
        let tooltipLeftEdge = left - actualTooltipWidth / 2;
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
        // Das Tooltip hat transform: translateX(-50%), daher ist die linke Kante bei: left - actualTooltipWidth / 2
        // tooltipLeftEdge wurde bereits oben berechnet

        // Die Position des Pfeils relativ zur linken Kante des Tooltips
        // targetCenter ist die X-Position der Mitte des Ziel-Elements im Viewport
        // arrowOffset ist der Abstand von der linken Kante des Tooltips zur Mitte des Ziel-Elements
        // Der Pfeil selbst hat auch transform: translateX(-50%), daher zeigt die linke Position auf die Mitte des Pfeils
        let arrowOffset = targetCenter - tooltipLeftEdge;

        // Stelle sicher, dass der Pfeil innerhalb des Tooltips bleibt (mit etwas Abstand zu den Rändern)
        const minArrowOffset = 20; // Mindestabstand vom linken Rand des Tooltips
        const maxArrowOffset = actualTooltipWidth - 20; // Mindestabstand vom rechten Rand

        // Für Info-Button: Berechne die Position komplett neu
        if (targetId === "info-button") {
          // Finde das Info-Button-Element durch Suche nach dem Button mit img, der direkt vor dem Abmelden-Button steht
          const allButtons = document.querySelectorAll(
            'header button, .headerContainer button, [class*="buttonsRight"] button'
          );
          const buttonsArray = Array.from(allButtons);

          // Finde den Abmelden-Button (hat Text "Abmelden" oder "logout")
          const abmeldenButton = buttonsArray.find((btn) => {
            const text = btn.textContent?.trim() || "";
            return (
              text.toLowerCase().includes("abmelden") ||
              text.toLowerCase().includes("logout")
            );
          });

          let infoButton = null;
          if (abmeldenButton) {
            // Finde den Button direkt vor dem Abmelden-Button
            const abmeldenIndex = buttonsArray.indexOf(abmeldenButton);
            if (abmeldenIndex > 0) {
              const possibleInfoButton = buttonsArray[abmeldenIndex - 1];
              // Prüfe, ob es ein Button mit img ist (Info-Button hat ein img)
              if (
                possibleInfoButton &&
                possibleInfoButton.querySelector("img")
              ) {
                infoButton = possibleInfoButton;
              }
            }
          }

          // Fallback: Suche nach Button mit id="info-button"
          if (!infoButton) {
            const byId = document.getElementById("info-button");
            if (
              byId &&
              byId.querySelector("img") &&
              !byId.textContent?.toLowerCase().includes("abmelden")
            ) {
              infoButton = byId;
            }
          }

          // Berechne die Pfeil-Position basierend auf dem gefundenen Info-Button
          if (infoButton) {
            const infoRect = infoButton.getBoundingClientRect();
            const infoCenter = infoRect.left + infoRect.width / 2;
            arrowOffset = infoCenter - tooltipLeftEdge;
          } else {
            // Falls Info-Button nicht gefunden, verschiebe den Pfeil stark nach links
            arrowOffset = arrowOffset - 200;
          }

          // Stelle sicher, dass der Pfeil innerhalb des Tooltips bleibt
          if (arrowOffset < 20) arrowOffset = 20;
          if (arrowOffset > actualTooltipWidth - 20)
            arrowOffset = actualTooltipWidth - 20;
        } else {
          arrowOffset = Math.max(
            minArrowOffset,
            Math.min(arrowOffset, maxArrowOffset)
          );
        }

        const arrowLeft = `${arrowOffset}px`;

        setTooltipStyle({
          top: `${top}px`,
          left: `${left}px`,
          transform: "translateX(-50%)", // Horizontal zentrieren
          maxWidth: `${actualTooltipWidth}px`, // Stelle sicher, dass das Tooltip nicht zu breit ist
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
  const finalStyle = {
    ...tooltipStyle,
    maxWidth: tooltipStyle.maxWidth ? tooltipStyle.maxWidth : `${maxWidth}px`,
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
      className={styles.tooltip}
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

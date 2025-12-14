import { useState, useEffect } from "react";
import { auth } from "./firebase/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./pages/Auth";
import { Ticktask } from "./pages/Ticktask.jsx";
import { Login } from "./pages/Login";
import styles from "./App.module.css";
import { LanguageProvider } from "./contexts/LanguageContext";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(() => {
    // Prüfe localStorage für direkten Wechsel zur Registrierung
    const shouldShowAuth = localStorage.getItem("ticktask_showAuth");
    if (shouldShowAuth === "true") {
      localStorage.removeItem("ticktask_showAuth");
      return false; // Zeige Registrierung
    }
    return true; // Zeige Login
  });
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authInitError, setAuthInitError] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(() => {
    // Prüfe localStorage beim Initialisieren
    return localStorage.getItem("ticktask_guestMode") === "true";
  });

  const handleGuestLogin = () => {
    try {
      // Guest Mode should ALWAYS open in English.
      // Preserve the user's previous preference to restore after leaving Guest Mode.
      const preGuestKey = "ticktask_pre_guest_language";
      const current = localStorage.getItem("ticktask_language");
      if (current && current !== "en" && !localStorage.getItem(preGuestKey)) {
        localStorage.setItem(preGuestKey, current);
      }

      localStorage.setItem("ticktask_language", "en");
      window.dispatchEvent(
        new CustomEvent("ticktask_force_language", {
          detail: { language: "en" },
        })
      );
    } catch {
      // ignore
    }
    setIsGuestMode(true);
  };

  // When leaving Guest Mode, restore the previously saved language (if any)
  useEffect(() => {
    if (isGuestMode) return;
    try {
      const preGuestKey = "ticktask_pre_guest_language";
      const prev = localStorage.getItem(preGuestKey);
      if (prev && prev !== localStorage.getItem("ticktask_language")) {
        localStorage.setItem("ticktask_language", prev);
        window.dispatchEvent(
          new CustomEvent("ticktask_force_language", {
            detail: { language: prev },
          })
        );
      }
      if (prev) localStorage.removeItem(preGuestKey);
    } catch {
      // ignore
    }
  }, [isGuestMode]);

  // Speichere Guest-Mode im localStorage
  useEffect(() => {
    if (isGuestMode) {
      localStorage.setItem("ticktask_guestMode", "true");
    } else {
      localStorage.removeItem("ticktask_guestMode");
    }
  }, [isGuestMode]);

  // Safari (macOS/iOS): Class setzen, um CSS Workarounds sauber zu targeten
  useEffect(() => {
    try {
      const ua = navigator.userAgent || "";
      const isSafari =
        /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|CriOS|FxiOS/i.test(ua);
      document.documentElement.classList.toggle("isSafari", isSafari);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    let gotFirstAuthEvent = false;

    // Fallback: nie im Loader hängen bleiben (z.B. wenn onAuthStateChanged wirft oder nie feuert)
    const fallbackTimer = window.setTimeout(() => {
      if (gotFirstAuthEvent) return;
      console.warn("⚠️ Auth init timeout – proceeding without auth state");
      setAuthInitError((prev) => prev || new Error("Auth init timeout"));
      setAuthReady(true);
    }, 4000);

    try {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        gotFirstAuthEvent = true;
        window.clearTimeout(fallbackTimer);
        setIsLoggedIn(!!user);
        setUser(user);
        setAuthReady(true); // idempotent

        // Wenn ein Benutzer eingeloggt ist, verlasse den Guest-Mode
        if (user) {
          setIsGuestMode(false);
        }
      });
    } catch (e) {
      console.error("❌ Failed to init Firebase Auth listener", e);
      window.clearTimeout(fallbackTimer);
      setAuthInitError(e);
      setAuthReady(true);
    }

    return () => {
      window.clearTimeout(fallbackTimer);
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return (
    <LanguageProvider>
      <div className={styles.app}>
        {!authReady ? (
          <div style={{ backgroundColor: "#000", minHeight: "100vh" }}>
            Loading...
          </div>
        ) : isLoggedIn ? (
          <Ticktask user={user} isGuestMode={false} />
        ) : isGuestMode ? (
          <Ticktask user={null} isGuestMode={true} />
        ) : showLogin ? (
          <Login
            onSwitchToAuth={() => setShowLogin(false)}
            onGuestLogin={handleGuestLogin}
          />
        ) : (
          <Auth
            onSwitchToLogin={() => setShowLogin(true)}
            onGuestLogin={handleGuestLogin}
          />
        )}
      </div>
    </LanguageProvider>
  );
}

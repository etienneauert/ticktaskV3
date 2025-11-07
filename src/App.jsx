import { useState, useEffect } from "react";
import { auth } from "./firebase/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./pages/auth";
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
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  return (
    <LanguageProvider>
      <div className={styles.app}>
        {!authReady ? (
          <div>Wird geladen...</div>
        ) : isLoggedIn ? (
          <Ticktask user={user} isGuestMode={false} />
        ) : isGuestMode ? (
          <Ticktask user={null} isGuestMode={true} />
        ) : showLogin ? (
          <Login
            onSwitchToAuth={() => setShowLogin(false)}
            onGuestLogin={() => setIsGuestMode(true)}
          />
        ) : (
          <Auth 
            onSwitchToLogin={() => setShowLogin(true)} 
            onGuestLogin={() => setIsGuestMode(true)}
          />
        )}
      </div>
    </LanguageProvider>
  );
}

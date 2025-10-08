import { useState, useEffect } from "react";
import { auth } from "./firebase/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./pages/auth";
import { Ticktask } from "./pages/Ticktask.jsx";
import { Login } from "./pages/Login";
import styles from "./App.module.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true); // ← Ändere zu true
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.app}>
      {!authReady ? (
        <div>Wird geladen...</div>
      ) : isLoggedIn ? (
        <Ticktask user={user} />
      ) : showLogin ? (
        <Login />
      ) : (
        <Auth />
      )}

      {!isLoggedIn && (
        <div>
          <button onClick={() => setShowLogin(!showLogin)}>
            {showLogin ? "Zur Registrierung" : "Zum Login"}
          </button>
        </div>
      )}
    </div>
  );
}

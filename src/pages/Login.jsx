import { useState } from "react";
import { auth } from "../firebase/firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import styles from "./Login.module.css";

export function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // Login erfolgreich - onAuthStateChanged in App.jsx wird automatisch ausgelöst
    } catch (error) {
      console.error("Login-Fehler:", error);

      // Benutzerfreundliche Fehlermeldungen
      switch (error.code) {
        case "auth/user-not-found":
          setError("Kein Benutzer mit dieser E-Mail gefunden");
          break;
        case "auth/wrong-password":
          setError("Falsches Passwort");
          break;
        case "auth/invalid-email":
          setError("Ungültige E-Mail-Adresse");
          break;
        case "auth/too-many-requests":
          setError(
            "Zu viele fehlgeschlagene Versuche. Bitte warte einen Moment"
          );
          break;
        default:
          setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.Login}>
      <h1>TickTask Login</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="deine@email.com"
          />
        </div>

        <div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Dein Passwort"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logge ein..." : "Einloggen"}
        </button>
      </form>

      <div>
        <button
          onClick={() => {
            setFormData({
              email: "andi@gmail.com",
              password: "testing",
            });
          }}
        >
          Quick Login
        </button>
      </div>

      {error && <div>{error}</div>}
    </div>
  );
}

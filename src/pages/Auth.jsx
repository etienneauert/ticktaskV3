import { useState } from "react";
import { auth } from "../firebase/firebase.js";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export default function Auth() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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
    setMessage("");

    // Validierung
    if (formData.password !== formData.confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    if (formData.password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    setLoading(true);

    try {
      // Benutzer registrieren
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Benutzername aktualisieren
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      setMessage("Registrierung erfolgreich! Willkommen bei TickTask!");

      // Formular zurücksetzen
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Registrierungsfehler:", error);

      // Benutzerfreundliche Fehlermeldungen
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("Diese E-Mail-Adresse wird bereits verwendet");
          break;
        case "auth/invalid-email":
          setError("Ungültige E-Mail-Adresse");
          break;
        case "auth/weak-password":
          setError("Passwort ist zu schwach");
          break;
        default:
          setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>TickTask Registrierung</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Dein vollständiger Name"
          />
        </div>

        <div>
          <label>E-Mail:</label>
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
          <label>Passwort:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Mindestens 6 Zeichen"
          />
        </div>

        <div>
          <label>Passwort bestätigen:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Passwort wiederholen"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Registriere..." : "Registrieren"}
        </button>
      </form>

      {error && <div>{error}</div>}

      {message && <div>{message}</div>}
    </div>
  );
}

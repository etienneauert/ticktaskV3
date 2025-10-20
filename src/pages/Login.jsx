import { useState } from "react";
import { auth } from "../firebase/firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import styles from "./Login.module.css";

export function Login({ onSwitchToAuth, onGuestLogin }) {
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
      // Login successful - onAuthStateChanged in App.jsx will fire automatically
    } catch (error) {
      console.error("Login error:", error);

      // Friendly error messages
      switch (error.code) {
        case "auth/user-not-found":
          setError("No user found with this email");
          break;
        case "auth/wrong-password":
          setError("Incorrect password");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please wait a moment");
          break;
        default:
          setError("An error occurred. Please try again.");
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
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Your password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
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

      <div className={styles.actionsRow}>
        <button className={styles.switchButton} onClick={onSwitchToAuth}>
          Register
        </button>
        <button className={styles.guestButton} onClick={onGuestLogin}>
          Guest Login
        </button>
      </div>
    </div>
  );
}

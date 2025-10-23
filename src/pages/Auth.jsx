import { useState } from "react";
import { auth } from "../firebase/firebase.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import googleIcon from "../assets/google.png";
import styles from "./Auth.module.css";

export default function Auth({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // Register user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      setMessage("Registration successful! Welcome to TickTask!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Friendly error messages
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("This email address is already in use");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/weak-password":
          setError("Password is too weak");
          break;
        default:
          setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      setMessage("");

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in App.jsx wird automatisch ausgelöst
    } catch (error) {
      console.error("Google Sign-In error:", error);

      if (error.code === "auth/popup-closed-by-user") {
        setError("Google Sign-In wurde abgebrochen");
      } else if (error.code === "auth/popup-blocked") {
        setError("Popup wurde blockiert. Bitte erlaube Popups für diese Seite");
      } else {
        setError("Google Sign-In Fehler. Bitte versuche es erneut.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.Auth}>
      <h1>TickTask Registration</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Your full name"
          />
        </div>

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
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Repeat password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {message && <div className={styles.message}>{message}</div>}

      {/* Google Sign-In Button */}
      <div className={styles.googleSignIn}>
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className={styles.googleButton}
        >
          {googleLoading ? "Google Sign-In..." : "Sign in with Google"}
          <img src={googleIcon} alt="Google" className={styles.googleIcon} />
        </button>
      </div>

      <button className={styles.switchButton} onClick={onSwitchToLogin}>
        Go to Login
      </button>
    </div>
  );
}

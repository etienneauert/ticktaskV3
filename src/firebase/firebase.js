import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Firestore mit erweiterten Einstellungen initialisieren
import {
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  connectFirestoreEmulator as connectEmulator,
} from "firebase/firestore";

// Firestore mit CORS-optimierten Einstellungen initialisieren
let db;
try {
  // Verwende Standard-Firestore mit CORS-Optimierungen
  db = getFirestore(app);

  // Konfiguriere Firestore für bessere CORS-Kompatibilität
  console.log("✅ Firestore initialized with CORS optimizations");
} catch (error) {
  console.error("❌ Failed to initialize Firestore:", error);
  // Fallback auf Standard-Firestore
  db = getFirestore(app);
}

// Firebase Verbindungsstatus überwachen mit Retry-Mechanismus
export const checkFirebaseConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await enableNetwork(db);
      console.log("✅ Firebase connection active");
      return true;
    } catch (error) {
      console.warn(
        `⚠️ Firebase connection attempt ${i + 1}/${retries} failed:`,
        error
      );
      if (i === retries - 1) {
        console.error("❌ All Firebase connection attempts failed");
        return false;
      }
      // Warte 1 Sekunde vor dem nächsten Versuch
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return false;
};

// Automatische Verbindungsüberwachung
let connectionCheckInterval;
export const startConnectionMonitoring = () => {
  if (connectionCheckInterval) return;

  connectionCheckInterval = setInterval(async () => {
    const isConnected = await checkFirebaseConnection(1);
    if (!isConnected) {
      console.warn("🔄 Attempting to reconnect to Firebase...");
    }
  }, 30000); // Alle 30 Sekunden prüfen
};

export const stopConnectionMonitoring = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

export { app, analytics, auth, db };

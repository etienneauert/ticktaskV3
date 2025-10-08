// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTaOpyAf8L1hxz3Dwny5iKAyl2dpHsTDg",
  authDomain: "ticktaskv3.firebaseapp.com",
  projectId: "ticktaskv3",
  storageBucket: "ticktaskv3.firebasestorage.app",
  messagingSenderId: "1010568854119",
  appId: "1:1010568854119:web:c28fa511f4e0957ca2f2c2",
  measurementId: "G-5574P3G9VV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };

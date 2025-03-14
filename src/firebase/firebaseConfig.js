// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getVertexAI, getGenerativeModel } from "firebase/vertexai";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESS_SENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MSR_ID,
};

const app = initializeApp(firebaseConfig);
const vertexAI = getVertexAI(app);
export const geminiModel = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });


let analytics = null;

// Safely initialize Analytics if supported and in the browser environment
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      } else {
        console.log("Analytics is not supported in this environment.");
      }
    })
    .catch((error) => {
      console.error("Error checking analytics support:", error);
    });
}

const db = getFirestore(app);

export { app, analytics, db };

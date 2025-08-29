// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Initialize Google AI (Free API)
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash" // Using latest free model
});

const db = getFirestore(app);

// Initialize Firebase Messaging (only on client side)
let messaging;
if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

export { app, db, messaging };
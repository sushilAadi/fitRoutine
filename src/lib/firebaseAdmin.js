import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// For now, we'll use the web config. In production, you should use a service account key
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // In production, you would add service account credentials here
  // credential: cert({
  //   projectId: process.env.FIREBASE_PROJECT_ID,
  //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // })
};

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseAdminConfig);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Fallback initialization for development
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
} else {
  app = getApps()[0];
}

export const messaging = getMessaging(app);
export default app;
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK with service account credentials
let app;
if (getApps().length === 0) {
  try {
    // Check if we have Firebase Admin credentials
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const firebaseAdminConfig = {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'neeed-fit',
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || 'neeed-fit',
      };
      
      app = initializeApp(firebaseAdminConfig);
      console.log('Firebase Admin SDK initialized with credentials');
    } else {
      // Fallback initialization for development/build
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'neeed-fit',
      });
      console.log('Firebase Admin SDK initialized without credentials (fallback)');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Final fallback
    app = initializeApp({
      projectId: 'neeed-fit',
    });
  }
} else {
  app = getApps()[0];
}

export const messaging = getMessaging(app);
export default app;
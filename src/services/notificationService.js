import { messaging } from "@/firebase/firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

// Your web app's Firebase configuration VAPID key (you'll need to get this from Firebase Console)
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Request permission for push notifications and get FCM token
 */
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.warn('Messaging not initialized (likely SSR)');
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });
      
      if (token) {
        console.log('FCM registration token:', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    return null;
  }
};

/**
 * Store FCM token in Firestore for a user
 */
export const storeFCMToken = async (userId, userEmail, token, userType = 'client') => {
  try {
    await addDoc(collection(db, "fcm_tokens"), {
      userId,
      userEmail,
      token,
      userType, // 'client', 'mentor', or 'admin'
      createdAt: new Date().toISOString(),
      isActive: true
    });
    console.log('FCM token stored successfully');
  } catch (error) {
    console.error('Error storing FCM token:', error);
  }
};

/**
 * Listen for incoming messages when app is in foreground
 */
export const setupForegroundMessageListener = () => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Create a custom notification
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const { title, body, icon } = payload.notification || {};
      
      new Notification(title || 'Fit App Notification', {
        body: body || 'You have a new notification',
        icon: icon || '/icon-192x192.png',
        badge: '/icon-192x192.png'
      });
    }
  });
};

/**
 * Send notification to specific users via API
 */
export const sendNotificationToUsers = async (userEmails, title, body, data = {}) => {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmails,
        title,
        body,
        data
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send notification');
    }
    
    const result = await response.json();
    console.log('Notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};
import { messaging } from "@/firebase/firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

// Your web app's Firebase configuration VAPID key
const VAPID_KEY = "BGTO1XYFkLwlSnYQKJu7sbX9Dwv2IMDU933Bp5apGYQEEHGcscF_ln938dfF5CqDMebA4czXHQOGCE5aieM4M8g";

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
 * Store FCM token and create welcome notification if not exists
 */
export const storeFCMToken = async (userId, userEmail, token, userType = 'client') => {
  try {
    // Check if FCM token already exists for this user
    const tokensQuery = query(
      collection(db, "fcm_tokens"),
      where("userId", "==", userId),
      where("token", "==", token),
      where("isActive", "==", true)
    );
    const existingTokens = await getDocs(tokensQuery);
    
    if (existingTokens.empty) {
      // Store FCM token only if it doesn't exist
      await addDoc(collection(db, "fcm_tokens"), {
        userId,
        userEmail,
        token,
        userType, // 'client', 'mentor', or 'admin'
        createdAt: new Date().toISOString(),
        isActive: true
      });
      console.log('New FCM token stored successfully');
    } else {
      console.log('FCM token already exists for this user');
    }

    // Check if welcome notification already exists
    const welcomeQuery = query(
      collection(db, "notifications"),
      where("userEmail", "==", userEmail),
      where("type", "==", "welcome")
    );
    const existingWelcome = await getDocs(welcomeQuery);

    if (existingWelcome.empty) {
      // Create welcome notification only if it doesn't exist
      await addDoc(collection(db, "notifications"), {
        userId,
        userEmail,
        title: "Welcome to Fit App!",
        body: "Push notifications are now enabled for your account.",
        type: "welcome",
        isRead: false,
        createdAt: new Date().toISOString()
      });
      console.log('Welcome notification created');
    } else {
      console.log('Welcome notification already exists');
    }

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
 * Store notification in Firebase (for in-app notification display)
 * This replaces the old FCM push notification sending
 */
export const storeNotificationInFirebase = async (userEmails, title, body, data = {}) => {
  try {
    // Store notifications in database for each user
    const notificationPromises = userEmails.map(async (email) => {
      // Check if similar notification already exists to prevent duplicates
      const existingQuery = query(
        collection(db, "notifications"),
        where("userEmail", "==", email),
        where("title", "==", title),
        where("type", "==", data.type || "enrollment")
      );
      const existingNotifications = await getDocs(existingQuery);
      
      // Only create if no similar notification exists in the last 5 minutes
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      let shouldCreate = true;
      existingNotifications.forEach(doc => {
        const notificationDate = new Date(doc.data().createdAt);
        if (notificationDate > fiveMinutesAgo) {
          shouldCreate = false;
        }
      });

      if (shouldCreate) {
        await addDoc(collection(db, "notifications"), {
          userEmail: email,
          title,
          body,
          type: data.type || "enrollment",
          data,
          isRead: false,
          createdAt: new Date().toISOString()
        });
        console.log(`Notification stored for ${email}`);
      }
    });

    await Promise.all(notificationPromises);
    
    // Show browser notification if permission is granted (local only)
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        tag: `fit-app-${Date.now()}`,
      });
    }

    return { success: true, message: 'Notifications stored successfully' };
  } catch (error) {
    console.error('Error storing notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send enrollment notifications - Updated to store in Firebase only
 * WhatsApp notifications are now handled separately in EnrollmentForm
 */
export const sendEnrollmentNotifications = async (adminEmails, mentorEmail, clientName, mentorName, amount) => {
  try {
    const enrollmentData = {
      type: 'enrollment',
      clientName,
      mentorName,
      amount: String(amount)
    };

    // Store notification for admin(s) in Firebase
    if (adminEmails && adminEmails.length > 0) {
      await storeNotificationInFirebase(
        adminEmails,
        '💰 New Enrollment - Payment Received!',
        `${clientName} enrolled with ${mentorName}. Payment: ₹${amount}. Review and approve the enrollment.`,
        enrollmentData
      );
    }

    // Store notification for mentor in Firebase
    if (mentorEmail) {
      await storeNotificationInFirebase(
        [mentorEmail],
        '🎉 New Student Enrolled!',
        `${clientName} has enrolled for your training program. Payment completed: ₹${amount}. Welcome your new student!`,
        enrollmentData
      );
    }

    return true;
  } catch (error) {
    console.error('Error storing enrollment notifications:', error);
    return false;
  }
};

/**
 * DEPRECATED: This function no longer sends FCM push notifications
 * It only stores notifications in Firebase for in-app display
 * WhatsApp notifications are handled separately via whatsappService
 */
export const sendNotificationToUsers = async (userEmails, title, body, data = {}) => {
  console.warn('sendNotificationToUsers is deprecated. Use storeNotificationInFirebase for in-app notifications and whatsappService for WhatsApp messages.');
  return await storeNotificationInFirebase(userEmails, title, body, data);
};
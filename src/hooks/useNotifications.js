import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  requestNotificationPermission, 
  storeFCMToken, 
  setupForegroundMessageListener 
} from '@/services/notificationService';

export const useNotifications = () => {
  const { user } = useUser();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user) return;

      try {
        // Request permission and get token
        const token = await requestNotificationPermission();
        
        if (token) {
          setFcmToken(token);
          setPermissionGranted(true);
          
          // Store token in Firestore
          await storeFCMToken(
            user.id,
            user.primaryEmailAddress?.emailAddress || '',
            token,
            'client' // or determine user type based on your app logic
          );
          
          console.log('Notifications initialized successfully');
        } else {
          console.log('Notification permission denied or token not available');
        }
        
        // Set up foreground message listener
        setupForegroundMessageListener();
        
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [user]);

  return {
    permissionGranted,
    fcmToken,
    requestPermission: requestNotificationPermission
  };
};
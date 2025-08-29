"use client";

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationInit = () => {
  const { permissionGranted } = useNotifications();

  useEffect(() => {
    // Register service worker for FCM
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null; // This component doesn't render anything
};

export default NotificationInit;
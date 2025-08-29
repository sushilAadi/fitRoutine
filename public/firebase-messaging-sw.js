// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCM14ZKJW9uHnxTGCnSTij3kMlpbARiYn4",
  authDomain: "neeed-fit.firebaseapp.com",
  projectId: "neeed-fit",
  storageBucket: "neeed-fit.firebasestorage.app",
  messagingSenderId: "260980493927",
  appId: "1:260980493927:web:51aa67f7afd508ebd6cec2",
  measurementId: "G-9PLRJHY448"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const { title, body, icon } = payload.notification || {};
  
  const notificationOptions = {
    body: body || 'You have a new notification from Fit App',
    icon: icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'fit-app-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  return self.registration.showNotification(
    title || 'Fit App Notification',
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
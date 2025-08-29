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
  const data = payload.data || {};
  
  const notificationOptions = {
    body: body || 'You have a new notification from Fit App',
    icon: icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: `fit-app-${data.type || 'general'}-${Date.now()}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'open',
        title: 'View Details',
        icon: '/icon-192x192.png'
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

  const data = event.notification.data || {};
  
  if (event.action === 'open' || !event.action) {
    let targetUrl = '/';
    
    // Navigate to specific pages based on notification type
    if (data.type === 'enrollment') {
      targetUrl = '/notifications';
    } else if (data.type === 'welcome') {
      targetUrl = '/notifications';
    }
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If the app is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: targetUrl,
              data: data
            });
            return;
          }
        }
        // If app is not open, open it
        return clients.openWindow(targetUrl);
      })
    );
  }
});
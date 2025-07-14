importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBTUUb_y1aP8fiVNXuIC9w-83dyGjg-qDo",
  authDomain: "birthdayreminder-a5def.firebaseapp.com",
  projectId: "birthdayreminder-a5def",
  storageBucket: "birthdayreminder-a5def.firebasestorage.app",
  messagingSenderId: "858610635830",
  appId: "1:858610635830:web:1a17972bcb1e439ca43497",
  measurementId: "G-DQDNPCSJ0R"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Birthday Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a birthday reminder!',
            icon: '/Logo.png',
        badge: '/Logo.png',
    tag: 'birthday-reminder',
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Reminder',
        icon: '/Logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    vibrate: [200, 100, 200],
    sound: 'default'
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to reminders
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});
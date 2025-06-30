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

// Custom sound function
function playCustomSound(soundType = 'default') {
  try {
    let soundUrl = '/sounds/';
    
    switch(soundType) {
      case 'birthday':
        soundUrl += 'birthday-notification.mp3';
        break;
      case 'reminder':
        soundUrl += 'reminder-sound.mp3';
        break;
      case 'celebration':
        soundUrl += 'celebration.mp3';
        break;
      case 'gentle':
        soundUrl += 'gentle-chime.mp3';
        break;
      case 'urgent':
        soundUrl += 'urgent-bell.mp3';
        break;
      default:
        // Use browser default sound
        return;
    }
    
    // Create audio element and play
    const audio = new Audio(soundUrl);
    audio.volume = 0.7; // Adjust volume (0.0 to 1.0)
    audio.play().catch(err => {
      console.log('Custom sound failed, using default:', err);
    });
  } catch (error) {
    console.log('Custom sound error:', error);
  }
}

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Birthday Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a birthday reminder!',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'birthday-reminder',
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Reminder',
        icon: '/logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    vibrate: [200, 100, 200],
    sound: 'default' // Use default system notification sound
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
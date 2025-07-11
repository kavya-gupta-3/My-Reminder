import { useEffect } from 'react';
import { auth, database, ref, update, messaging, getToken, onMessage } from './firebase';

const VAPID_KEY = 'BErpz_gv8ZdgfQHCO02bBN-wSJNs3MniFcHNsVrq_tpljf7KC73kuDm8m8QVuJeW_ZY4tKicLDHgETx9_2PPIdE';

export function useFCMToken() {
  useEffect(() => {
    // Wait for user to be logged in
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
      }

      try {
        // Request permission first
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
          
          // Register service worker
          if ('serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
              console.log('Service Worker registered:', registration);
              
              // Get FCM token
              const token = await getToken(messaging, { 
                vapidKey: VAPID_KEY, 
                serviceWorkerRegistration: registration 
              });
              
              if (token) {
                console.log('FCM token obtained:', token);
                await update(ref(database, `users/${user.uid}`), { 
                  fcmToken: token,
                  notificationPermission: 'granted',
                  lastTokenUpdate: new Date().toISOString()
                });
                console.log('FCM token saved to database');
              } else {
                console.log('No FCM token available');
              }
            } catch (swError) {
              console.error('Service Worker registration failed:', swError);
            }
          }
        } else {
          console.log('Notification permission denied');
          await update(ref(database, `users/${user.uid}`), { 
            notificationPermission: 'denied' 
          });
        }
      } catch (err) {
        console.error('FCM setup error:', err);
      }
    });

    // Handle foreground messages
    const unsubscribeMessage = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification even when app is open
      if (Notification.permission === 'granted') {
        const notification = new Notification(payload.notification?.title || 'Birthday Reminder', {
          body: payload.notification?.body || 'You have a birthday reminder!',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'birthday-reminder',
          requireInteraction: true
          // Removed actions - only supported in ServiceWorker notifications
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    });

    return () => {
      unsubscribe();
      unsubscribeMessage();
    };
  }, []);
}
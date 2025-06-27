import { useEffect } from 'react';
import { auth, database, ref, update, messaging, getToken } from './firebase';

const VAPID_KEY = 'BDa5R1My7l2zhSQJDRFj39eOER_QUMajg1tw6IXtzFn95t4HuFLVHMHusztKnLhFuFywmgSMEdU4Oqx-OktVMjk';

export function useFCMToken() {
  useEffect(() => {
    // Wait for user to be logged in
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      if (!('Notification' in window)) return;

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const swReg = await navigator.serviceWorker.ready;
          const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
          if (token) {
            await update(ref(database, `users/${user.uid}`), { fcmToken: token });
            console.log('FCM token saved:', token);
          }
        }
      } catch (err) {
        console.error('FCM token error:', err);
      }
    });
    return () => unsubscribe();
  }, []);
}
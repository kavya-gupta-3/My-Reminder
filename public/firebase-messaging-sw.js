importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage(function(payload) {
  const { title, ...options } = payload.notification;
  self.registration.showNotification(title, options);
});
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  push, 
  onValue, 
  off, 
  remove,
  update
} from 'firebase/database';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBTUUb_y1aP8fiVNXuIC9w-83dyGjg-qDo",
  authDomain: "birthdayreminder-a5def.firebaseapp.com",
  projectId: "birthdayreminder-a5def",
  storageBucket: "birthdayreminder-a5def.firebasestorage.app",
  messagingSenderId: "858610635830",
  appId: "1:858610635830:web:1a17972bcb1e439ca43497",
  measurementId: "G-DQDNPCSJ0R"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// FCM
const messaging = getMessaging(app);

export { 
  auth, 
  database, 
  ref, 
  set, 
  get, 
  push, 
  onValue, 
  off, 
  remove,
  update,
  googleProvider, 
  signInAnonymously, 
  analytics,
  messaging,
  getToken,
  onMessage
};

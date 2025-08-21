// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// New, direct configuration for glamdash-v2
const firebaseConfig = {
  apiKey: "AIzaSyAW8yejnIrZbO4MqYmCNbGmAAhlRkwQh90",
  authDomain: "glamdash-v2.firebaseapp.com",
  projectId: "glamdash-v2",
  storageBucket: "glamdash-v2.appspot.com",
  messagingSenderId: "728543552523",
  appId: "1:728543552523:web:0b9ce3020049134101130e",
  measurementId: "G-7ZPGYNE36X"
};

// Initialize Firebase for the client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Add error handling for Firestore connection issues
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🟢 Network connection restored');
  });
  
  window.addEventListener('offline', () => {
    console.log('🔴 Network connection lost');
  });
}

export { db, auth, app };

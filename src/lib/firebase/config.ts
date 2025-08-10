// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "glamdash-p52up",
  appId: "1:377482692254:web:193ad76bf35c7fc9f95d8f",
  storageBucket: "glamdash-p52up.firebasestorage.app",
  apiKey: "AIzaSyDyyDSAWW-X7TEOUZF8ErO7ce2q_9Z4BHo",
  authDomain: "glamdash-p52up.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "377482692254"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Enable Firestore offline persistence
try {
    enableIndexedDbPersistence(db);
    console.log("Firebase persistence enabled.");
} catch (error: any) {
    if (error.code === 'failed-precondition') {
        console.warn('Firebase persistence failed. This may happen when multiple tabs are open.');
    } else if (error.code === 'unimplemented') {
        console.log('Firebase persistence is not available in this browser environment.');
    }
}

export { db, auth };

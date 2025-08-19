// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

export { db, auth, app };

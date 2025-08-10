
// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };


// Cargar variables de entorno desde .env.local si existe
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as admin from 'firebase-admin';

console.log("--- Firebase Admin SDK Initialization ---");

// This is the new, more robust initialization method.
// It relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable
// pointing to the JSON file.

if (!admin.apps.length) {
  try {
    // Check if the environment variable is set.
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error(
        'The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Please check your .env.local file.'
      );
    }
    
    console.log(`Initializing Firebase Admin SDK via credentials file: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

    admin.initializeApp({
      // The credential is automatically found from the environment variable.
      credential: admin.credential.applicationDefault(),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
    });

    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error: any) {
    console.error('CRITICAL: Firebase admin initialization failed:', error);
  }
} else {
    console.log("Firebase Admin SDK already initialized.");
}

// Export the initialized services
// These will throw an error if initialization failed, which is what we want.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

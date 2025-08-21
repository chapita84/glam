
// Cargar variables de entorno desde .env.local si existe
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as admin from 'firebase-admin';

console.log("--- Firebase Admin SDK Initialization ---");

// This is the new, more robust initialization method.
// It uses the base64 encoded credentials from environment variable
// to avoid storing JSON files in the repository.

let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    // Check if the base64 credentials environment variable is set.
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Skipping Firebase Admin initialization.');
      
      // Create mock exports for build time
      const mockAuth = {
        setCustomUserClaims: () => Promise.resolve(),
        getUser: () => Promise.resolve({ uid: '', email: '' }),
        listUsers: () => Promise.resolve({ users: [] })
      } as any;
      
      const mockDb = {
        collection: () => ({ doc: () => ({ set: () => Promise.resolve() }) })
      } as any;
      
      adminAuth = mockAuth;
      adminDb = mockDb;
      
    } else {
      console.log('Initializing Firebase Admin SDK via base64 encoded credentials...');

      // Decode the base64 credentials
      const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const credentialsBuffer = Buffer.from(credentialsBase64, 'base64');
      const credentialsJson = credentialsBuffer.toString('utf8');
      const serviceAccount = JSON.parse(credentialsJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
      });

      console.log('Firebase Admin SDK initialized successfully with base64 credentials.');
      
      // Export the initialized services
      adminAuth = admin.auth();
      adminDb = admin.firestore();
    }

  } catch (error: any) {
    console.error('CRITICAL: Firebase admin initialization failed:', error);
    
    // Create safe mock exports even when initialization fails
    const mockAuth = {
      setCustomUserClaims: () => Promise.reject(new Error('Firebase Admin not initialized')),
      getUser: () => Promise.reject(new Error('Firebase Admin not initialized')),
      listUsers: () => Promise.reject(new Error('Firebase Admin not initialized'))
    } as any;
    
    const mockDb = {
      collection: () => ({ doc: () => ({ set: () => Promise.reject(new Error('Firebase Admin not initialized')) }) })
    } as any;
    
    adminAuth = mockAuth;
    adminDb = mockDb;
  }
} else {
  console.log("Firebase Admin SDK already initialized.");
  adminAuth = admin.auth();
  adminDb = admin.firestore();
}

// Export the services (either real or mock)
export { adminAuth, adminDb };

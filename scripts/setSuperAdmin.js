
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const uid = process.argv[2];

if (!uid) {
  console.error('Error: Please provide a UID as a command-line argument.');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  admin.auth().setCustomUserClaims(uid, { globalRole: 'superAdmin' })
    .then(() => {
      console.log(`Successfully set globalRole="superAdmin" for user ${uid}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error setting custom claims:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Firebase admin initialization error', error);
  process.exit(1);
}

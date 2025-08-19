
const admin = require('firebase-admin');
// Make sure your google-credentials.json is configured correctly
const serviceAccount = require('../google-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Error: Please provide the email of the user to make super admin.');
  process.exit(1);
}

async function setSuperAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { superadmin: true });
    console.log(`Successfully set superadmin claim for user: ${email} (UID: ${user.uid})`);
    console.log('Please ask the user to log out and log back in for the changes to take effect.');
  } catch (error) {
    console.error('Error setting super admin claim:', error.message);
    process.exit(1);
  }
}

setSuperAdminClaim(userEmail);

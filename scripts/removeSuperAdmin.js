const admin = require('firebase-admin');
// Make sure your google-credentials.json is configured correctly
const serviceAccount = require('../google-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Error: Please provide the email of the user to remove super admin claim.');
  process.exit(1);
}

async function removeSuperAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    
    // Get current claims
    const userRecord = await admin.auth().getUser(user.uid);
    const currentClaims = userRecord.customClaims || {};
    
    // Remove superadmin claim
    const newClaims = { ...currentClaims };
    delete newClaims.superadmin;
    
    await admin.auth().setCustomUserClaims(user.uid, newClaims);
    console.log(`Successfully removed superadmin claim for user: ${email} (UID: ${user.uid})`);
    console.log('Please ask the user to log out and log back in for the changes to take effect.');
  } catch (error) {
    console.error('Error removing super admin claim:', error.message);
    process.exit(1);
  }
}

removeSuperAdminClaim(userEmail);

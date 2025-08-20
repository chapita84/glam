const admin = require('firebase-admin');
const serviceAccount = require('../google-credentials.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkMembership() {
  const uid = 'JR4Cv9juJDVJbuxHSH6kTwQP4Fu2';
  const studioId = 'Xz0t6mSMxHZcARXQ0Bvl';
  
  console.log('Checking membership for:', { uid, studioId });
  
  // Verificar membresía por query
  const membersQuery = db.collection('studio_members').where('userId', '==', uid);
  const membersSnap = await membersQuery.get();
  console.log('\nMemberships found by query:');
  membersSnap.docs.forEach(doc => {
    console.log('  ID:', doc.id);
    console.log('  Data:', doc.data());
  });
  
  // Verificar documento esperado por las reglas
  const expectedDocId = uid + '_' + studioId;
  const memberDoc = await db.collection('studio_members').doc(expectedDocId).get();
  console.log('\nDocument expected by rules (' + expectedDocId + '):');
  if (memberDoc.exists) {
    console.log('  EXISTS - Data:', memberDoc.data());
  } else {
    console.log('  DOES NOT EXIST');
    
    // Crear el documento si no existe
    if (membersSnap.docs.length > 0) {
      const membershipData = membersSnap.docs[0].data();
      console.log('\nCreating expected document with data:', membershipData);
      await db.collection('studio_members').doc(expectedDocId).set(membershipData);
      console.log('Document created successfully!');
    }
  }
}

checkMembership().catch(console.error);

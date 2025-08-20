const admin = require('firebase-admin');
const serviceAccount = require('../google-credentials.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function checkStudioRole() {
  const studioId = 'Xz0t6mSMxHZcARXQ0Bvl';
  const roleId = 'owner';
  
  console.log('Checking studio role:', { studioId, roleId });
  
  // Verificar si existe el rol en el estudio
  const roleDoc = await db.collection('studios').doc(studioId).collection('roles').doc(roleId).get();
  console.log('\nStudio role document (' + roleId + '):');
  if (roleDoc.exists) {
    console.log('  EXISTS - Data:', roleDoc.data());
  } else {
    console.log('  DOES NOT EXIST');
    
    // Crear un rol básico de owner
    const ownerRole = {
      id: 'owner',
      name: 'Propietario',
      permissions: [
        'dashboard:view',
        'dashboard:view-analytics',
        'appointments:view',
        'appointments:manage',
        'appointments:block-time',
        'services:view',
        'services:manage',
        'staff:view',
        'staff:manage',
        'budgets:view',
        'budgets:manage',
        'budgets:generate-ai',
        'settings:manage-studio',
        'settings:manage-roles',
        'settings:manage-billing',
      ]
    };
    
    console.log('\nCreating owner role with data:', ownerRole);
    await db.collection('studios').doc(studioId).collection('roles').doc(roleId).set(ownerRole);
    console.log('Owner role created successfully!');
  }
}

checkStudioRole().catch(console.error);

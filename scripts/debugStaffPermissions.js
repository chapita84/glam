const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../google-credentials.json')),
  });
}

const db = admin.firestore();

async function debugStaffPermissions() {
  try {
    console.log('🔍 Debuggeando permisos de staff...\n');

    // Primero listar algunos usuarios para encontrar el correcto
    console.log('📋 Listando usuarios registrados:');
    const listUsersResult = await admin.auth().listUsers(10);
    listUsersResult.users.forEach(userRecord => {
      console.log(`   - ${userRecord.email} (${userRecord.uid})`);
      if (userRecord.customClaims) {
        console.log(`     Claims: ${JSON.stringify(userRecord.customClaims)}`);
      }
    });
    console.log('');

    // Usar el usuario owner para las pruebas
    const testUser = listUsersResult.users.find(u => u.email === 'ownerbe@gmail.com');
    if (!testUser) {
      console.log('❌ No se encontró usuario owner');
      return;
    }

    console.log('👤 Usuario de prueba:', testUser.uid);
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Custom Claims:', testUser.customClaims);
    console.log('');

    // Obtener membresías del usuario
    const membershipsSnapshot = await db.collection('studio_members')
      .where('userId', '==', testUser.uid)
      .get();

    console.log('🏢 Membresías encontradas:', membershipsSnapshot.size);
    membershipsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: Studio ${data.studioId}, Role: ${data.roleId}`);
    });
    console.log('');

    // Obtener info de los estudios
    for (const membershipDoc of membershipsSnapshot.docs) {
      const membership = membershipDoc.data();
      const studioId = membership.studioId;
      
      console.log(`🏪 Verificando estudio ${studioId}:`);
      
      // Verificar acceso a estudio
      try {
        const studioDoc = await db.collection('studios').doc(studioId).get();
        console.log(`   ✅ Acceso al documento del estudio: ${studioDoc.exists}`);
      } catch (error) {
        console.log(`   ❌ Error accediendo al estudio: ${error.message}`);
      }

      // Verificar acceso a staff del estudio
      try {
        const staffSnapshot = await db.collection('studios').doc(studioId).collection('staff').get();
        console.log(`   ✅ Acceso a staff del estudio: ${staffSnapshot.size} documentos`);
      } catch (error) {
        console.log(`   ❌ Error accediendo a staff: ${error.message}`);
      }

      // Verificar acceso a otras membresías del estudio
      try {
        const otherMembersSnapshot = await db.collection('studio_members')
          .where('studioId', '==', studioId)
          .get();
        console.log(`   ✅ Acceso a otros miembros: ${otherMembersSnapshot.size} documentos`);
      } catch (error) {
        console.log(`   ❌ Error accediendo a otros miembros: ${error.message}`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugStaffPermissions().then(() => {
  console.log('✅ Debug completado');
  process.exit(0);
});

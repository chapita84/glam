const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../google-credentials.json')),
  });
}

const db = admin.firestore();

async function migrateStaffToSubcollection() {
  try {
    console.log('🔄 Migrando staff a subcoleción...\n');

    // Obtener todas las membresías de estudio
    const membershipsSnapshot = await db.collection('studio_members').get();
    
    console.log(`📋 Encontradas ${membershipsSnapshot.size} membresías`);
    
    const studios = new Map();
    
    // Agrupar por estudio
    membershipsSnapshot.forEach(doc => {
      const membership = doc.data();
      const studioId = membership.studioId;
      
      if (!studios.has(studioId)) {
        studios.set(studioId, []);
      }
      
      studios.get(studioId).push({
        userId: membership.userId,
        roleId: membership.roleId,
        membershipId: doc.id
      });
    });

    console.log(`🏢 Encontrados ${studios.size} estudios\n`);

    // Para cada estudio, crear/actualizar la subcoleción de staff
    for (const [studioId, members] of studios) {
      console.log(`🏪 Procesando estudio: ${studioId}`);
      console.log(`   👥 Miembros: ${members.length}`);
      
      for (const member of members) {
        try {
          // Obtener información del usuario
          const userDoc = await db.collection('users').doc(member.userId).get();
          
          if (!userDoc.exists) {
            console.log(`   ⚠️  Usuario ${member.userId} no encontrado, saltando...`);
            continue;
          }
          
          const userData = userDoc.data();
          
          // Crear documento en la subcoleción de staff
          const staffData = {
            userId: member.userId,
            displayName: userData.displayName || userData.name || 'Staff Member',
            email: userData.email || '',
            photoURL: userData.photoURL || '',
            roleId: member.roleId || 'staff',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await db.collection(`studios/${studioId}/staff`).doc(member.userId).set(staffData, { merge: true });
          
          console.log(`   ✅ Creado staff: ${userData.displayName || userData.email} (${member.roleId})`);
          
        } catch (error) {
          console.log(`   ❌ Error procesando miembro ${member.userId}:`, error.message);
        }
      }
      
      console.log('');
    }

    console.log('✅ Migración completada');

  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
}

migrateStaffToSubcollection().then(() => {
  console.log('🎉 Proceso terminado');
  process.exit(0);
});

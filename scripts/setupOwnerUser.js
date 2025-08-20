const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = require('../google-credentials.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function setupOwnerUser() {
  const email = 'ownerbe@gmail.com';
  
  try {
    console.log(`\n=== Configurando usuario owner: ${email} ===`);
    
    // 1. Verificar si el usuario existe en Auth
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log('✅ Usuario encontrado en Auth:', user.uid);
    } catch (error) {
      console.log('❌ Usuario no encontrado en Auth. Creándolo...');
      user = await auth.createUser({
        email: email,
        password: 'TempPassword123!', // El usuario debe cambiar esto
        displayName: 'Owner BE'
      });
      console.log('✅ Usuario creado en Auth:', user.uid);
    }
    
    // 2. Establecer custom claims de superadmin
    await auth.setCustomUserClaims(user.uid, { superadmin: true });
    console.log('✅ Claims de superadmin establecidos');
    
    // 3. Verificar/crear perfil en Firestore
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.log('📝 Creando perfil en Firestore...');
      await userDocRef.set({
        uid: user.uid,
        email: email,
        displayName: 'Owner BE',
        globalRole: 'superAdmin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Perfil creado en Firestore');
    } else {
      console.log('✅ Perfil ya existe en Firestore');
      // Actualizar globalRole si es necesario
      await userDocRef.update({
        globalRole: 'superAdmin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Perfil actualizado con rol superAdmin');
    }
    
    // 4. Verificar estudios existentes
    const studiosSnapshot = await db.collection('studios').limit(5).get();
    console.log(`\n📊 Estudios existentes: ${studiosSnapshot.size}`);
    
    studiosSnapshot.forEach(doc => {
      const studio = doc.data();
      console.log(`  - ${studio.name} (${doc.id})`);
    });
    
    console.log('\n✅ Configuración completada. El usuario puede ahora:');
    console.log('  - Loguearse como superAdmin');
    console.log('  - Gestionar todos los estudios');
    console.log('  - Crear nuevos estudios');
    console.log('\n⚠️  IMPORTANTE: Cambiar la contraseña temporal después del primer login');
    
  } catch (error) {
    console.error('❌ Error configurando usuario:', error);
  }
}

// Ejecutar el script
setupOwnerUser().then(() => {
  console.log('\n🎉 Script completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, where, getDocs, query, doc, getDoc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAW8yejnIrZbO4MqYmCNbGmAAhlRkwQh90",
  authDomain: "glamdash-v2.firebaseapp.com",
  projectId: "glamdash-v2",
  storageBucket: "glamdash-v2.appspot.com",
  messagingSenderId: "728543552523",
  appId: "1:728543552523:web:0b9ce3020049134101130e",
  measurementId: "G-7ZPGYNE36X"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugStaffMembership() {
  try {
    console.log('🔍 Debugeando membresía de staff...\n');

    const staffEmail = 'staff@gmail.com';
    
    // 1. Buscar usuario por email
    console.log(`📧 Buscando usuario: ${staffEmail}`);
    const usersQuery = query(collection(db, 'users'), where('email', '==', staffEmail));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log(`✅ Usuario encontrado:`);
    console.log(`   - ID: ${userId}`);
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - Name: ${userData.displayName || userData.name}`);
    console.log(`   - Global Role: ${userData.globalRole}`);
    console.log('');

    // 2. Buscar membresías en studio_members
    console.log('🔍 Buscando en studio_members...');
    const membershipsQuery = query(collection(db, 'studio_members'), where('userId', '==', userId));
    const membershipsSnapshot = await getDocs(membershipsQuery);
    
    console.log(`   Membresías encontradas: ${membershipsSnapshot.size}`);
    membershipsSnapshot.forEach(docSnap => {
      const membership = docSnap.data();
      console.log(`   - Studio: ${membership.studioId}, Role: ${membership.roleId}`);
    });
    console.log('');

    // 3. Buscar en subcolecciones de staff
    console.log('🔍 Buscando en subcolecciones de staff...');
    const studiosSnapshot = await getDocs(collection(db, 'studios'));
    
    console.log(`   Revisando ${studiosSnapshot.size} estudios...`);
    
    let staffFound = false;
    for (const studioDoc of studiosSnapshot.docs) {
      const studioId = studioDoc.id;
      const studioData = studioDoc.data();
      
      try {
        const staffDocRef = doc(db, `studios/${studioId}/staff`, userId);
        const staffDocSnap = await getDoc(staffDocRef);
        
        if (staffDocSnap.exists()) {
          const staffData = staffDocSnap.data();
          staffFound = true;
          console.log(`   ✅ Staff encontrado en estudio: ${studioData.name} (${studioId})`);
          console.log(`      - Role ID: ${staffData.roleId}`);
          console.log(`      - Name: ${staffData.displayName || staffData.name}`);
          console.log(`      - Email: ${staffData.email}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error checking studio ${studioId}: ${error.message}`);
      }
    }
    
    if (!staffFound) {
      console.log('   ❌ Staff no encontrado en ninguna subcoleción');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugStaffMembership().then(() => {
  console.log('\n🎉 Debug completado');
  process.exit(0);
});

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import { getGlobalRolePermissions } from '../src/lib/permissions.js';

const firebaseConfig = {
  // Tu configuración de Firebase
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeGlobalRoles() {
  console.log('Inicializando roles globales...');
  
  const roles = [
    {
      id: 'superAdmin',
      name: 'Super Administrador',
      description: 'Acceso completo a toda la plataforma',
      permissions: getGlobalRolePermissions('superAdmin')
    },
    {
      id: 'owner',
      name: 'Propietario de Estudio',
      description: 'Propietario que puede gestionar uno o más estudios',
      permissions: getGlobalRolePermissions('owner')
    },
    {
      id: 'staff',
      name: 'Personal de Estudio',
      description: 'Empleado que trabaja en un estudio específico',
      permissions: getGlobalRolePermissions('staff')
    },
    {
      id: 'customer',
      name: 'Cliente',
      description: 'Usuario final que puede reservar servicios',
      permissions: getGlobalRolePermissions('customer')
    }
  ];

  try {
    for (const role of roles) {
      await setDoc(doc(collection(db, 'global_roles'), role.id), role);
      console.log(`✅ Rol ${role.name} creado`);
    }
    console.log('🎉 Todos los roles globales han sido inicializados');
  } catch (error) {
    console.error('❌ Error inicializando roles:', error);
  }
}

initializeGlobalRoles();

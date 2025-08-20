// Script para inicializar la colección de usuarios en Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getAuth } from 'firebase/firestore';
import { getAuth as getAuthAdmin } from 'firebase-admin/auth';
import admin from 'firebase-admin';

// Configuración de Firebase (usa las variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para crear la colección de usuarios
async function createUsersCollection() {
  console.log('🚀 Inicializando colección de usuarios...');
  
  // Usuario actual (Super Admin)
  const currentUserProfile = {
    uid: 'PcMQiynuH2ajCcLAp6SSGGWKdnN2', // Tu UID actual
    email: 'santiago.perez.p@gmail.com',
    firstName: 'Santiago',
    lastName: 'Perez',
    displayName: 'Santiago Perez',
    phone: '+54 9 11 1234-5678', // Opcional
    globalRole: 'superAdmin',
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    photoURL: null
  };

  // Usuarios de ejemplo
  const exampleUsers = [
    {
      uid: 'example-owner-1',
      email: 'owner@estudio1.com',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      displayName: 'Maria Rodriguez',
      phone: '+54 9 11 2345-6789',
      globalRole: 'owner',
      disabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      photoURL: null
    },
    {
      uid: 'example-staff-1',
      email: 'staff@estudio1.com',
      firstName: 'Juan',
      lastName: 'Gonzalez',
      displayName: 'Juan Gonzalez',
      phone: '+54 9 11 3456-7890',
      globalRole: 'staff',
      disabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      photoURL: null
    },
    {
      uid: 'example-customer-1',
      email: 'cliente@example.com',
      firstName: 'Ana',
      lastName: 'Lopez',
      displayName: 'Ana Lopez',
      phone: '+54 9 11 4567-8901',
      globalRole: 'customer',
      disabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      photoURL: null
    }
  ];

  try {
    // Crear el usuario actual
    await setDoc(doc(db, 'users', currentUserProfile.uid), currentUserProfile);
    console.log('✅ Usuario Super Admin creado:', currentUserProfile.email);

    // Crear usuarios de ejemplo
    for (const user of exampleUsers) {
      await setDoc(doc(db, 'users', user.uid), user);
      console.log('✅ Usuario de ejemplo creado:', user.email);
    }

    console.log('🎉 Colección de usuarios inicializada exitosamente!');
    console.log(`📊 Total de usuarios creados: ${1 + exampleUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error inicializando usuarios:', error);
  }
}

// Ejecutar la función
createUsersCollection();

export { createUsersCollection };

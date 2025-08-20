import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { app } from './config';

const functions = getFunctions(app);

// Conectar al emulador en desarrollo
if (process.env.NODE_ENV === 'development') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 8742);
    console.log('🔗 Conectado al emulador de Firebase Functions en puerto 8742');
  } catch (error) {
    // Ya estaba conectado o error de conexión
    console.log('📡 Emulador ya conectado o error de conexión');
  }
}

// Cloud Functions
export const createUserFunction = httpsCallable(functions, 'createUser');
export const listUsersFunction = httpsCallable(functions, 'listUsers');
export const updateUserFunction = httpsCallable(functions, 'updateUser');
export const deleteUserFunction = httpsCallable(functions, 'deleteUser');

// Interfaces
export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  globalRole: 'superAdmin' | 'owner' | 'staff' | 'customer';
  studioId?: string;
}

export interface UpdateUserData {
  uid: string;
  displayName?: string;
  globalRole?: string;
  disabled?: boolean;
}

export interface DeleteUserData {
  uid: string;
}

// Función principal para crear usuarios con Cloud Function
export async function createUserWithCloudFunction(userData: CreateUserData): Promise<any> {
  try {
    console.log('📞 Llamando a Cloud Function para crear usuario:', userData.email);
    
    const result = await createUserFunction(userData);
    
    console.log('✅ Usuario creado exitosamente via Cloud Function:', result.data);
    return result.data;
    
  } catch (error: any) {
    console.error('❌ Error en Cloud Function:', error);
    
    // Manejo específico de errores de Cloud Functions
    if (error.code) {
      switch (error.code) {
        case 'functions/permission-denied':
          throw new Error('No tienes permisos para crear usuarios. Solo los Super Admins pueden realizar esta acción.');
        case 'functions/invalid-argument':
          throw new Error(error.message || 'Datos inválidos proporcionados para crear el usuario.');
        case 'functions/already-exists':
          throw new Error('Ya existe un usuario con este email.');
        case 'functions/internal':
          throw new Error(error.message || 'Error interno del servidor.');
        case 'auth/email-already-exists':
          throw new Error('El email ya está en uso');
        case 'auth/invalid-email':
          throw new Error('Email inválido');
        case 'auth/weak-password':
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        default:
          throw new Error(error.message || 'Error al crear usuario');
      }
    }
    
    throw new Error('Error inesperado al crear usuario: ' + (error.message || 'Error desconocido'));
  }
}

// Función para listar usuarios
export async function listUsersWithCloudFunction(): Promise<any> {
  try {
    console.log('📞 Llamando a Cloud Function para listar usuarios');
    const result = await listUsersFunction();
    console.log('✅ Usuarios obtenidos exitosamente');
    return result.data;
  } catch (error: any) {
    console.error('❌ Error al listar usuarios:', error);
    throw new Error('Error al obtener usuarios: ' + (error.message || 'Error desconocido'));
  }
}

// Función para actualizar usuario
export async function updateUserWithCloudFunction(userData: UpdateUserData): Promise<any> {
  try {
    console.log('📞 Llamando a Cloud Function para actualizar usuario:', userData.uid);
    const result = await updateUserFunction(userData);
    console.log('✅ Usuario actualizado exitosamente');
    return result.data;
  } catch (error: any) {
    console.error('❌ Error al actualizar usuario:', error);
    throw new Error('Error al actualizar usuario: ' + (error.message || 'Error desconocido'));
  }
}

// Función para eliminar usuario
export async function deleteUserWithCloudFunction(userData: DeleteUserData): Promise<any> {
  try {
    console.log('📞 Llamando a Cloud Function para eliminar usuario:', userData.uid);
    const result = await deleteUserFunction(userData);
    console.log('✅ Usuario eliminado exitosamente');
    return result.data;
  } catch (error: any) {
    console.error('❌ Error al eliminar usuario:', error);
    throw new Error('Error al eliminar usuario: ' + (error.message || 'Error desconocido'));
  }
}

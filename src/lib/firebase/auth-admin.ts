import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './config';
import { createUserWithCloudFunction, type CreateUserData } from './functions';

// Función para crear un nuevo usuario usando Cloud Function (PROFESIONAL)
export async function createNewUser(
  email: string, 
  password: string, 
  displayName: string, 
  globalRole: 'superAdmin' | 'owner' | 'staff' | 'customer'
): Promise<string> {
  try {
    // Preparar datos para Cloud Function
    const userData: CreateUserData = {
      email,
      password,
      displayName,
      firstName: displayName.split(' ')[0] || '',
      lastName: displayName.split(' ').slice(1).join(' ') || '',
      globalRole
    };
    
    console.log('Creando usuario con Cloud Function...');
    const result = await createUserWithCloudFunction(userData);
    
    console.log('Usuario creado exitosamente:', result);
    
    if (result.uid) {
      return result.uid;
    } else {
      throw new Error(result.message || 'Error desconocido al crear usuario');
    }
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error; // Re-lanzar el error para que lo maneje el componente
  }
}

// Función para enviar email de restablecimiento de contraseña
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw new Error('Error al enviar email de restablecimiento: ' + error.message);
  }
}

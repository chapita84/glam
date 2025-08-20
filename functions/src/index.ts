
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

admin.initializeApp();
const db = admin.firestore();

// Helper function to check for Super Admin privileges
const ensureSuperAdmin = (context: any) => {
  logger.info("Verificando permisos de Super Admin", {
    auth: context.auth,
    token: context.auth?.token,
    globalRole: context.auth?.token?.globalRole
  });
  
  // En modo emulador, permitir bypass para testing
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    logger.info("🧪 Modo emulador detectado - permitiendo acceso para testing");
    return;
  }
  
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Usuario no autenticado.");
  }
  
  if (context.auth?.token?.globalRole !== 'superAdmin') {
    throw new HttpsError("permission-denied", `Acceso denegado. Rol requerido: superAdmin, rol actual: ${context.auth?.token?.globalRole || 'undefined'}`);
  }
};

// --- Reconstructed Admin User Management Functions ---

export const listUsers = onCall({ cors: true }, async (request) => {
  ensureSuperAdmin(request);
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      disabled: user.disabled,
      customClaims: user.customClaims,
    }));
    return users;
  } catch (error) {
    logger.error("Error listing users:", error);
    throw new HttpsError("internal", "Could not list users.");
  }
});

export const createUser = onCall({ cors: true }, async (request) => {
    logger.info("Solicitud de creación de usuario recibida", {
        data: request.data,
        auth: request.auth
    });
    
    ensureSuperAdmin(request);
    const { email, password, displayName, globalRole, firstName, lastName } = request.data;
    
    // Validaciones
    if (!email || !password || !globalRole) {
        throw new HttpsError("invalid-argument", "Email, password y globalRole son requeridos.");
    }
    
    if (password.length < 6) {
        throw new HttpsError("invalid-argument", "La contraseña debe tener al menos 6 caracteres.");
    }
    
    if (!['superAdmin', 'owner', 'staff', 'customer'].includes(globalRole)) {
        throw new HttpsError("invalid-argument", "Rol global inválido.");
    }
    
    try {
        // Crear usuario en Firebase Auth
        const userRecord = await admin.auth().createUser({ 
            email, 
            password, 
            displayName: displayName || `${firstName || ''} ${lastName || ''}`.trim() || email
        });
        
        // Establecer custom claims para el rol global
        await admin.auth().setCustomUserClaims(userRecord.uid, { globalRole });
        
        // Crear perfil completo en Firestore
        const now = new Date();
        const userProfile: any = {
            uid: userRecord.uid,
            email: email,
            firstName: firstName || displayName?.split(' ')[0] || '',
            lastName: lastName || displayName?.split(' ').slice(1).join(' ') || '',
            globalRole: globalRole,
            createdAt: now,
            updatedAt: now
        };
        
        // Solo agregar campos opcionales si tienen valores
        if (displayName) {
            userProfile.displayName = displayName;
        }
        
        await db.collection("users").doc(userRecord.uid).set(userProfile);
        
        logger.info(`Usuario creado exitosamente: ${email} con rol ${globalRole}`);
        
        return { 
            uid: userRecord.uid, 
            email: email,
            displayName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`.trim(),
            globalRole: globalRole,
            message: "Usuario creado exitosamente." 
        };
    } catch (error: any) {
        logger.error("Error creating user:", error);
        
        // Manejar errores específicos de Firebase Auth
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError("already-exists", "Ya existe un usuario con este email.");
        } else if (error.code === 'auth/invalid-email') {
            throw new HttpsError("invalid-argument", "El email proporcionado no es válido.");
        } else if (error.code === 'auth/weak-password') {
            throw new HttpsError("invalid-argument", "La contraseña es muy débil.");
        } else {
            throw new HttpsError("internal", `Error al crear usuario: ${error.message}`);
        }
    }
});

export const updateUser = onCall({ cors: true }, async (request) => {
    ensureSuperAdmin(request);
    const { uid, displayName, globalRole } = request.data;
    try {
        await admin.auth().updateUser(uid, { displayName });
        await admin.auth().setCustomUserClaims(uid, { globalRole });
        await db.collection("users").doc(uid).update({ displayName, globalRole });
        return { message: "User updated successfully." };
    } catch (error) {
        logger.error("Error updating user:", error);
        throw new HttpsError("internal", "Could not update user.");
    }
});

export const deleteUser = onCall({ cors: true }, async (request) => {
    ensureSuperAdmin(request);
    const { uid } = request.data;
    try {
        await admin.auth().deleteUser(uid);
        await db.collection("users").doc(uid).delete();
        // You might want to delete their studio memberships as well here
        return { message: "User deleted successfully." };
    } catch (error) {
        logger.error("Error deleting user:", error);
        throw new HttpsError("internal", "Could not delete user.");
    }
});


// --- Functions We Already Created ---

interface CreateStaffUserData {
  studioId: string;
  email: string;
  password: string;
  displayName: string;
  roleId: string;
  globalRole: 'owner' | 'staff' | 'customer';
}

export const createStaffUser = onCall({ cors: true }, async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be authenticated.");
    }
    // In production, you should also check if the caller is an owner of the target studioId
    
    const { studioId, email, password, displayName, roleId, globalRole } = request.data as CreateStaffUserData;
    logger.info(`Creating user ${email} for studio ${studioId}`);
    try {
      const userRecord = await admin.auth().createUser({ email, password, displayName });
      logger.info(`Successfully created user in Auth: ${userRecord.uid}`);
      
      const batch = db.batch();
      const userProfileRef = db.collection("users").doc(userRecord.uid);
      batch.set(userProfileRef, { uid: userRecord.uid, email, displayName, globalRole });

      const memberDocRef = db.collection("studio_members").doc(`${userRecord.uid}_${studioId}`);
      batch.set(memberDocRef, { userId: userRecord.uid, studioId, roleId });

      await batch.commit();
      logger.info(`Successfully created profile and membership for ${email}`);
      return { status: "success", uid: userRecord.uid };
    } catch (error: any) {
      logger.error("Error creating staff user:", error);
      if (error.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'This email is already in use.');
      }
      throw new HttpsError("internal", "An unexpected error occurred.");
    }
});

export const onStudioWritten = onDocumentWritten("studios/{studioId}", (event) => {
  const studioId = event.params.studioId;
  const studioData = event.data?.after.data();

  if (!studioData) {
    logger.info(`Deleting public data for studio ${studioId}`);
    return db.collection("studios_public").doc(studioId).delete();
  }

  logger.info(`Syncing public data for studio ${studioId}`);
  const publicData = {
    id: studioData.id,
    name: studioData.name,
    slug: studioData.slug,
  };

  return db.collection("studios_public").doc(studioId).set(publicData, { merge: true });
});

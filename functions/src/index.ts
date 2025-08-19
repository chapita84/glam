
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

admin.initializeApp();
const db = admin.firestore();

// Helper function to check for Super Admin privileges
const ensureSuperAdmin = (context: any) => {
  if (context.auth?.token.globalRole !== 'superAdmin') {
    throw new HttpsError("permission-denied", "You must be a Super Admin to perform this action.");
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
    ensureSuperAdmin(request);
    const { email, password, displayName, globalRole } = request.data;
    try {
        const userRecord = await admin.auth().createUser({ email, password, displayName });
        await admin.auth().setCustomUserClaims(userRecord.uid, { globalRole });
        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            displayName,
            globalRole,
        });
        return { uid: userRecord.uid, message: "User created successfully." };
    } catch (error) {
        logger.error("Error creating user:", error);
        throw new HttpsError("internal", "Could not create user.");
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
  globalRole: 'owner' | 'customer';
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

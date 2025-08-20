"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onStudioWritten = exports.createStaffUser = exports.deleteUser = exports.updateUser = exports.createUser = exports.listUsers = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
const db = admin.firestore();
// Helper function to check for Super Admin privileges
const ensureSuperAdmin = (context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    logger.info("Verificando permisos de Super Admin", {
        auth: context.auth,
        token: (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token,
        globalRole: (_c = (_b = context.auth) === null || _b === void 0 ? void 0 : _b.token) === null || _c === void 0 ? void 0 : _c.globalRole
    });
    // En modo emulador, permitir bypass para testing
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
        logger.info("🧪 Modo emulador detectado - permitiendo acceso para testing");
        return;
    }
    if (!context.auth) {
        throw new https_1.HttpsError("unauthenticated", "Usuario no autenticado.");
    }
    if (((_e = (_d = context.auth) === null || _d === void 0 ? void 0 : _d.token) === null || _e === void 0 ? void 0 : _e.globalRole) !== 'superAdmin') {
        throw new https_1.HttpsError("permission-denied", `Acceso denegado. Rol requerido: superAdmin, rol actual: ${((_g = (_f = context.auth) === null || _f === void 0 ? void 0 : _f.token) === null || _g === void 0 ? void 0 : _g.globalRole) || 'undefined'}`);
    }
};
// --- Reconstructed Admin User Management Functions ---
exports.listUsers = (0, https_1.onCall)({ cors: true }, async (request) => {
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
    }
    catch (error) {
        logger.error("Error listing users:", error);
        throw new https_1.HttpsError("internal", "Could not list users.");
    }
});
exports.createUser = (0, https_1.onCall)({ cors: true }, async (request) => {
    logger.info("Solicitud de creación de usuario recibida", {
        data: request.data,
        auth: request.auth
    });
    ensureSuperAdmin(request);
    const { email, password, displayName, globalRole, firstName, lastName } = request.data;
    // Validaciones
    if (!email || !password || !globalRole) {
        throw new https_1.HttpsError("invalid-argument", "Email, password y globalRole son requeridos.");
    }
    if (password.length < 6) {
        throw new https_1.HttpsError("invalid-argument", "La contraseña debe tener al menos 6 caracteres.");
    }
    if (!['superAdmin', 'owner', 'staff', 'customer'].includes(globalRole)) {
        throw new https_1.HttpsError("invalid-argument", "Rol global inválido.");
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
        const userProfile = {
            uid: userRecord.uid,
            email: email,
            firstName: firstName || (displayName === null || displayName === void 0 ? void 0 : displayName.split(' ')[0]) || '',
            lastName: lastName || (displayName === null || displayName === void 0 ? void 0 : displayName.split(' ').slice(1).join(' ')) || '',
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
    }
    catch (error) {
        logger.error("Error creating user:", error);
        // Manejar errores específicos de Firebase Auth
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError("already-exists", "Ya existe un usuario con este email.");
        }
        else if (error.code === 'auth/invalid-email') {
            throw new https_1.HttpsError("invalid-argument", "El email proporcionado no es válido.");
        }
        else if (error.code === 'auth/weak-password') {
            throw new https_1.HttpsError("invalid-argument", "La contraseña es muy débil.");
        }
        else {
            throw new https_1.HttpsError("internal", `Error al crear usuario: ${error.message}`);
        }
    }
});
exports.updateUser = (0, https_1.onCall)({ cors: true }, async (request) => {
    ensureSuperAdmin(request);
    const { uid, displayName, globalRole } = request.data;
    try {
        await admin.auth().updateUser(uid, { displayName });
        await admin.auth().setCustomUserClaims(uid, { globalRole });
        await db.collection("users").doc(uid).update({ displayName, globalRole });
        return { message: "User updated successfully." };
    }
    catch (error) {
        logger.error("Error updating user:", error);
        throw new https_1.HttpsError("internal", "Could not update user.");
    }
});
exports.deleteUser = (0, https_1.onCall)({ cors: true }, async (request) => {
    ensureSuperAdmin(request);
    const { uid } = request.data;
    try {
        await admin.auth().deleteUser(uid);
        await db.collection("users").doc(uid).delete();
        // You might want to delete their studio memberships as well here
        return { message: "User deleted successfully." };
    }
    catch (error) {
        logger.error("Error deleting user:", error);
        throw new https_1.HttpsError("internal", "Could not delete user.");
    }
});
exports.createStaffUser = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be authenticated.");
    }
    // In production, you should also check if the caller is an owner of the target studioId
    const { studioId, email, password, displayName, roleId, globalRole } = request.data;
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
    }
    catch (error) {
        logger.error("Error creating staff user:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'This email is already in use.');
        }
        throw new https_1.HttpsError("internal", "An unexpected error occurred.");
    }
});
exports.onStudioWritten = (0, firestore_1.onDocumentWritten)("studios/{studioId}", (event) => {
    var _a;
    const studioId = event.params.studioId;
    const studioData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
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
//# sourceMappingURL=index.js.map
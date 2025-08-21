/**
 * Script para agregar membresía de usuario al estudio
 * Solo ejecutar si el diagnóstico muestra que falta la membresía
 */

(async function addUserToStudio() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log('❌ No hay usuario autenticado');
            return;
        }

        const userId = user.uid;
        const studioId = 'Xz0t6mSMxHZcARXQ0Bvl';

        console.log(`➕ Agregando usuario ${userId} al estudio ${studioId}`);

        // Agregar membresía legacy
        const legacyMembershipId = `${userId}_${studioId}`;
        const legacyData = {
            userId: userId,
            studioId: studioId,
            role: 'owner', // o 'staff'
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await firebase.firestore().doc(`studio_members/${legacyMembershipId}`).set(legacyData);
        console.log('✅ Membresía legacy agregada');

        // Agregar membresía staff
        const staffData = {
            userId: userId,
            role: 'owner',
            permissions: ['all'], // o los permisos específicos que necesites
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await firebase.firestore().doc(`studios/${studioId}/staff/${userId}`).set(staffData);
        console.log('✅ Membresía staff agregada');

        console.log('🎉 Usuario agregado exitosamente al estudio');

    } catch (error) {
        console.error('❌ Error agregando usuario:', error);
    }
})();

/**
 * Script para verificar membresías de usuario en el estudio
 * Este script debe ejecutarse desde las Developer Tools del navegador
 */

(async function checkUserMembership() {
    try {
        // Obtener el usuario actual
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log('❌ No hay usuario autenticado');
            return;
        }

        const userId = user.uid;
        const studioId = 'Xz0t6mSMxHZcARXQ0Bvl'; // Tu studio ID

        console.log(`🔍 Verificando membresías para usuario: ${userId}`);
        console.log(`🏢 Studio ID: ${studioId}`);

        // 1. Verificar token claims
        const tokenResult = await user.getIdTokenResult();
        console.log('🎫 Token claims:', tokenResult.claims);

        // 2. Verificar membresía legacy
        const legacyMembershipId = `${userId}_${studioId}`;
        const legacyMemberRef = firebase.firestore().doc(`studio_members/${legacyMembershipId}`);
        const legacyMemberDoc = await legacyMemberRef.get();
        
        console.log(`👥 Legacy membership (${legacyMembershipId}):`);
        if (legacyMemberDoc.exists) {
            console.log('✅ EXISTS:', legacyMemberDoc.data());
        } else {
            console.log('❌ NOT FOUND');
        }

        // 3. Verificar membresía nueva (staff)
        const staffRef = firebase.firestore().doc(`studios/${studioId}/staff/${userId}`);
        const staffDoc = await staffRef.get();
        
        console.log(`👤 Staff membership:`);
        if (staffDoc.exists) {
            console.log('✅ EXISTS:', staffDoc.data());
        } else {
            console.log('❌ NOT FOUND');
        }

        // 4. Verificar si el estudio existe
        const studioRef = firebase.firestore().doc(`studios/${studioId}`);
        const studioDoc = await studioRef.get();
        
        console.log(`🏢 Studio exists:`);
        if (studioDoc.exists) {
            console.log('✅ YES:', studioDoc.data());
        } else {
            console.log('❌ NO');
        }

        // 5. Intentar buscar todas las membresías del usuario
        console.log('🔍 Buscando TODAS las membresías del usuario...');
        
        try {
            const allMembersQuery = firebase.firestore().collection('studio_members').where('userId', '==', userId);
            const allMembersSnap = await allMembersQuery.get();
            console.log(`📋 Total membresías encontradas: ${allMembersSnap.size}`);
            allMembersSnap.forEach((doc) => {
                console.log(`  - ${doc.id}:`, doc.data());
            });
        } catch (error) {
            console.log('❌ Error buscando membresías:', error);
        }

        // 6. Verificar perfil de usuario
        const userRef = firebase.firestore().doc(`users/${userId}`);
        const userDoc = await userRef.get();
        
        console.log(`👤 User profile:`);
        if (userDoc.exists) {
            console.log('✅ EXISTS:', userDoc.data());
        } else {
            console.log('❌ NOT FOUND');
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
})();

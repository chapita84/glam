// Función temporal para agregar membresía legacy
// Ejecutar esto una vez desde las Developer Tools del navegador

(async function addLegacyMembership() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log('❌ No hay usuario autenticado');
            return;
        }

        const userId = user.uid;
        const studioId = 'Xz0t6mSMxHZcARXQ0Bvl';
        const membershipId = `${userId}_${studioId}`;

        console.log(`➕ Agregando membresía legacy: ${membershipId}`);

        const membershipData = {
            userId: userId,
            studioId: studioId,
            role: 'owner',
            createdAt: firebase.firestore.Timestamp.now(),
            updatedAt: firebase.firestore.Timestamp.now()
        };

        await firebase.firestore()
            .collection('studio_members')
            .doc(membershipId)
            .set(membershipData);

        console.log('✅ Membresía legacy agregada exitosamente');
        console.log('🎉 Ahora deberías poder guardar presupuestos');

    } catch (error) {
        console.error('❌ Error agregando membresía legacy:', error);
    }
})();

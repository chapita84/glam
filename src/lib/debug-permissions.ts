import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function debugUserPermissions(studioId: string) {
    if (!auth.currentUser) {
        console.log('❌ No authenticated user');
        return false;
    }

    const userId = auth.currentUser.uid;
    console.log(`🔍 Debugging permissions for user ${userId} in studio ${studioId}`);

    try {
        // 1. Verificar token claims
        const tokenResult = await auth.currentUser.getIdTokenResult();
        console.log('🎫 Token claims:', tokenResult.claims);

        // 2. Verificar membresía legacy (studio_members)
        const legacyMembershipId = `${userId}_${studioId}`;
        const legacyMemberDoc = await getDoc(doc(db, 'studio_members', legacyMembershipId));
        console.log(`👥 Legacy membership (${legacyMembershipId}):`, legacyMemberDoc.exists() ? legacyMemberDoc.data() : 'NOT FOUND');

        // 3. Verificar membresía nueva (studios/{studioId}/staff/{userId})
        const staffDoc = await getDoc(doc(db, 'studios', studioId, 'staff', userId));
        console.log(`👤 Staff membership:`, staffDoc.exists() ? staffDoc.data() : 'NOT FOUND');

        // 4. Verificar si el estudio existe
        const studioDoc = await getDoc(doc(db, 'studios', studioId));
        console.log(`🏢 Studio exists:`, studioDoc.exists() ? 'YES' : 'NO');

        // 5. Verificar perfil de usuario
        const userDoc = await getDoc(doc(db, 'users', userId));
        console.log(`👤 User profile:`, userDoc.exists() ? userDoc.data() : 'NOT FOUND');

        return {
            hasLegacyMembership: legacyMemberDoc.exists(),
            hasStaffMembership: staffDoc.exists(),
            studioExists: studioDoc.exists(),
            userExists: userDoc.exists(),
            tokenClaims: tokenResult.claims
        };

    } catch (error) {
        console.error('❌ Error debugging permissions:', error);
        return false;
    }
}

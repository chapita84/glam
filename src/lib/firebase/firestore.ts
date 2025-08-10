
import { db } from './config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Role } from '@/app/(app)/layout';

// Type for role data stored in Firestore
type RoleFirestoreData = {
    id: string;
    name: string;
    permissions: string[]; // Stored as an array of strings
}

/**
 * Fetches all roles for a given tenant from Firestore.
 * @param tenantId The ID of the tenant.
 * @returns A promise that resolves to an array of Role objects.
 */
export async function getRoles(tenantId: string): Promise<Role[]> {
    const rolesCollectionRef = collection(db, 'tenants', tenantId, 'roles');
    try {
        const querySnapshot = await getDocs(rolesCollectionRef);
        const roles: Role[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as RoleFirestoreData;
            roles.push({
                id: data.id,
                name: data.name,
                permissions: new Set(data.permissions || []), // Convert array to Set
            });
        });
        return roles;
    } catch (error) {
        console.error("Error fetching roles: ", error);
        return [];
    }
}

/**
 * Adds a new role or updates an existing one in Firestore.
 * @param tenantId The ID of the tenant.
 * @param role The role object to add or update. The id will be used as the document ID.
 */
export async function addOrUpdateRole(tenantId: string, role: {id: string, name: string, permissions: string[]}): Promise<void> {
    const roleDocRef = doc(db, 'tenants', tenantId, 'roles', role.id);
    const roleData: RoleFirestoreData = {
        id: role.id,
        name: role.name,
        permissions: role.permissions,
    }
    try {
        await setDoc(roleDocRef, roleData, { merge: true });
        console.log("Role saved successfully: ", role.id);
    } catch (error) {
        console.error("Error saving role: ", error);
    }
}


/**
 * Deletes a role from Firestore.
 * @param tenantId The ID of the tenant.
 * @param roleId The ID of the role to delete.
 */
export async function deleteRole(tenantId: string, roleId: string): Promise<void> {
    const roleDocRef = doc(db, 'tenants', tenantId, 'roles', roleId);
    try {
        await deleteDoc(roleDocRef);
        console.log("Role deleted successfully: ", roleId);
    } catch (error) {
        console.error("Error deleting role: ", error);
    }
}


import { db } from './config';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Role, Permission } from '@/lib/types';

// Helper to get all permission IDs
const getAllPermissionIds = (permissions: Permission[]): string[] => {
    return permissions.flatMap(p => [p.id, ...(p.children ? getAllPermissionIds(p.children) : [])]);
};

// =================================================================
// Type Definitions
// =================================================================

export type Studio = {
    id: string;
    name: string;
    ownerId: string;
    logoUrl?: string;
    createdAt: any;
    location?: string;
    phone?: string;
    description?: string;
};

type RoleFirestoreData = Omit<Role, 'permissions'> & { permissions: string[] };

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatar?: string;
  joinedAt?: any; 
};

export type Service = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
}

export type Booking = { id: string; clientId: string; clientName: string; staffId: string; staffName: string; serviceId: string; serviceName: string; duration: number; startTime: Date; endTime: Date; status: 'confirmed' | 'completed' | 'canceled_by_user' | 'canceled_by_studio' | 'no_show'; price: { amount: number; currency: string; }; createdAt?: any; notes?: string; }
export type Budget = { id?: string; budgetName: string; clientName: string; status: 'draft' | 'sent' | 'approved' | 'rejected'; createdAt?: any; updatedAt?: any; eventInfo: any; items: any[]; summary: any; totalDuration?: number; }
export type WorkingHour = { dayOfWeek: number; startTime: string; endTime: string; enabled: boolean; }
export type StudioConfig = { workingHours: WorkingHour[]; }
export type TimeBlock = {
    id: string;
    startTime: Date;
    endTime: Date;
    reason: string; // e.g., 'Vacation', 'Personal', 'Event'
    isAllDay: boolean;
    createdAt?: any;
}


// =================================================================
// Initial Data Seeding for a NEW Studio
// =================================================================

async function seedInitialDataForStudio(studioId: string, owner: { uid: string, email?: string | null, displayName?: string | null }) {
    console.log(`Seeding initial data for new studio: ${studioId}`);
    
    const allPermissions: Permission[] = [
        { id: "agenda", label: "Agenda", children: [{ id: "agenda_view", label: "Ver" }, { id: "agenda_manage", label: "Gestionar" }] },
        { id: "management", label: "Gestión", children: [{ id: "services_manage", label: "Gestionar Servicios" }, { id: "staff_manage", label: "Gestionar Personal" }, { id: "budgets_manage", label: "Gestionar Presupuestos" }, {id: "studios_manage", label: "Gestionar Estudios"}] },
        { id: "config", label: "Configuración", children: [{ id: "roles_manage", label: "Gestionar Roles" }, { id: "settings_manage", label: "Gestionar Ajustes" }, { id: "billing_manage", label: "Gestionar Facturación" }] },
        { id: "reports_view", label: "Ver Reportes" },
    ];
    const allPermissionIds = getAllPermissionIds(allPermissions);
    
    const ownerRole = { id: 'owner', name: 'Propietario', description: 'Rol con permisos para gestionar el estudio.', permissions: allPermissionIds };
    const superAdminRole = { id: 'super_admin', name: 'Super Admin', description: 'Rol con permisos para gestionar la plataforma.', permissions: allPermissionIds };
    await addOrUpdateRole(studioId, ownerRole);
    await addOrUpdateRole(studioId, superAdminRole);

    const ownerStaffMember: StaffMember = {
        id: owner.uid,
        name: owner.displayName || 'Super Admin',
        email: owner.email || 'superadmin@example.com',
        roleId: 'super_admin',
    };
    await addOrUpdateStaffMember(studioId, ownerStaffMember);

    const defaultServices: Service[] = [
        { id: 'corte-de-pelo', name: 'Corte de Cabello', category: 'Peluquería', duration: 60, price: 50 },
        { id: 'manicura-clasica', name: 'Manicura Clásica', category: 'Uñas', duration: 30, price: 25 },
    ];
    for (const service of defaultServices) {
        await addOrUpdateService(studioId, service);
    }
    
    console.log(`Finished seeding data for studio: ${studioId}`);
}

// =================================================================
// Studio Management (Main Collection)
// =================================================================

export async function createStudio(studioName: string, owner: { uid: string, email?: string | null, displayName?: string | null }): Promise<string> {
    const studioDocRef = doc(collection(db, 'studios'));
    const studioData: Studio = {
        id: studioDocRef.id,
        name: studioName,
        ownerId: owner.uid,
        createdAt: serverTimestamp(),
    };
    try {
        await setDoc(studioDocRef, studioData);
        await seedInitialDataForStudio(studioDocRef.id, owner);
        return studioDocRef.id;
    } catch (error: any) {
        console.error("Firebase Error creating studio: ", error.code, error.message);
        // This will give us a clear idea of what's failing, e.g., 'permission-denied'
        throw new Error(`Failed to create studio: ${error.message}`);
    }
}

export async function getStudioForUser(userId: string): Promise<Studio | null> {
    const q = query(collection(db, 'studios'), where('ownerId', '==', userId));
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data() as Studio;
        }
        return null;
    } catch (error) {
        console.error("Error fetching studio for user: ", error);
        return null;
    }
}

export async function getAllStudios(): Promise<Studio[]> {
    try {
        const q = query(collection(db, 'studios'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Studio);
    } catch (error) {
        console.error("Error fetching all studios: ", error);
        return [];
    }
}

export async function updateStudio(studioId: string, data: Partial<Omit<Studio, 'id'>>): Promise<void> {
    const studioDocRef = doc(db, 'studios', studioId);
    try {
        await updateDoc(studioDocRef, data);
    } catch (error) {
        console.error("Error updating studio: ", error);
        throw error;
    }
}

// =================================================================
// Subcollection Management (Roles, Staff, Services, etc. under a specific Studio)
// =================================================================

export async function getRoles(studioId: string): Promise<Role[]> {
    const rolesCollectionRef = collection(db, 'studios', studioId, 'roles');
    const querySnapshot = await getDocs(rolesCollectionRef);
    return querySnapshot.docs.map(doc => {
        const data = doc.data() as RoleFirestoreData;
        return { ...data, permissions: new Set(data.permissions || []) };
    });
}

export async function addOrUpdateRole(studioId: string, role: Omit<Role, 'permissions'> & { permissions: Set<string> | string[] }): Promise<void> {
    const roleDocRef = doc(db, 'studios', studioId, 'roles', role.id);
    const roleData: RoleFirestoreData = { ...role, permissions: Array.from(role.permissions) };
    await setDoc(roleDocRef, roleData, { merge: true });
}

export async function deleteRole(studioId: string, roleId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'studios', studioId, 'roles', roleId));
    } catch (error) {
        console.error(`Failed to delete role ${roleId} from studio ${studioId}:`, error);
        throw error;
    }
}

export async function getStaff(studioId: string): Promise<StaffMember[]> {
    const staffCollectionRef = collection(db, 'studios', studioId, 'staff');
    const querySnapshot = await getDocs(staffCollectionRef);
    return querySnapshot.docs.map(doc => doc.data() as StaffMember);
}

export async function addOrUpdateStaffMember(studioId: string, member: Omit<StaffMember, 'joinedAt'>): Promise<void> {
    const staffDocRef = doc(db, 'studios', studioId, 'staff', member.id);
    await setDoc(staffDocRef, { ...member, joinedAt: serverTimestamp() }, { merge: true });
}

export async function deleteStaffMember(studioId: string, userId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'studios', studioId, 'staff', userId));
    } catch (error) {
        console.error(`Failed to delete staff member ${userId} from studio ${studioId}:`, error);
        throw error;
    }
}

export async function getServices(studioId: string): Promise<Service[]> {
    const servicesCollectionRef = collection(db, 'studios', studioId, 'services');
    const querySnapshot = await getDocs(servicesCollectionRef);
    return querySnapshot.docs.map(doc => doc.data() as Service);
}

export async function addOrUpdateService(studioId: string, service: Service): Promise<void> {
    await setDoc(doc(db, 'studios', studioId, 'services', service.id), service, { merge: true });
}

export async function deleteService(studioId: string, serviceId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'studios', studioId, 'services', serviceId));
    } catch (error) {
        console.error(`Failed to delete service ${serviceId} from studio ${studioId}:`, error);
        throw error;
    }
}

export async function getBookings(studioId: string): Promise<Booking[]> {
    const bookingsCollectionRef = collection(db, 'studios', studioId, 'bookings');
    const querySnapshot = await getDocs(bookingsCollectionRef);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const startTime = data.startTime?.toDate ? data.startTime.toDate() : new Date();
        return {
            ...data,
            id: doc.id,
            startTime,
            endTime: new Date(startTime.getTime() + data.duration * 60000),
        } as Booking;
    });
}

export async function addOrUpdateBooking(studioId: string, booking: Omit<Booking, 'id' | 'createdAt' | 'endTime'> & { id?: string }): Promise<void> {
    const docRef = booking.id ? doc(db, 'studios', studioId, 'bookings', booking.id) : doc(collection(db, 'studios', studioId, 'bookings'));
    const bookingData = { ...booking, id: docRef.id, createdAt: serverTimestamp() };
    await setDoc(docRef, bookingData, { merge: true });
}

export async function deleteBooking(studioId: string, bookingId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'studios', studioId, 'bookings', bookingId));
    } catch (error) {
        console.error(`Failed to delete booking ${bookingId} from studio ${studioId}:`, error);
        throw error;
    }
}

export async function getBudgets(studioId: string): Promise<Budget[]> {
    const budgetsCollectionRef = collection(db, 'studios', studioId, 'budgets');
    const q = query(budgetsCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Budget);
}

export async function addOrUpdateBudget(studioId: string, budget: Omit<Budget, 'id'|'createdAt'|'updatedAt'> & {id?: string}): Promise<string> {
    const docRef = budget.id ? doc(db, 'studios', studioId, 'budgets', budget.id) : doc(collection(db, 'studios', studioId, 'budgets'));
    const budgetData = { ...budget, id: docRef.id, updatedAt: serverTimestamp() } as any;
    if (!budget.id) {
        budgetData.createdAt = serverTimestamp();
    }
    await setDoc(docRef, budgetData, { merge: true });
    return docRef.id;
}

export async function deleteBudget(studioId: string, budgetId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'studios', studioId, 'budgets', budgetId));
    } catch (error) {
        console.error(`Failed to delete budget ${budgetId} from studio ${studioId}:`, error);
        throw error;
    }
}

export async function getStudioConfig(studioId: string): Promise<StudioConfig | null> {
    const configDocRef = doc(db, 'studios', studioId);
    const docSnap = await getDoc(configDocRef);
    const data = docSnap.data() as { config?: StudioConfig };
    return data?.config || null;
}

export async function updateStudioConfig(studioId: string, config: StudioConfig): Promise<void> {
    await setDoc(doc(db, 'studios', studioId), { config }, { merge: true });
}

export async function uploadFile(file: File, path: string): Promise<string> {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

export async function getTimeBlocks(studioId: string, start: Date, end: Date): Promise<TimeBlock[]> {
    const timeBlocksCollectionRef = collection(db, 'studios', studioId, 'timeblocks');
    const q = query(timeBlocksCollectionRef, where('startTime', '>=', start), where('startTime', '<=', end));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            startTime: data.startTime.toDate(),
            endTime: data.endTime.toDate(),
            reason: data.reason,
            isAllDay: data.isAllDay
        } as TimeBlock;
    });
}

export async function addOrUpdateTimeBlock(studioId: string, block: Omit<TimeBlock, 'id' | 'createdAt'> & { id?: string }): Promise<void> {
    const docRef = block.id ? doc(db, 'studios', studioId, 'timeblocks', block.id) : doc(collection(db, 'studios', studioId, 'timeblocks'));
    const blockData = { ...block, id: docRef.id, createdAt: serverTimestamp() };
    await setDoc(docRef, blockData, { merge: true });
}

export async function deleteTimeBlock(studioId: string, blockId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'studios', studioId, 'timeblocks', blockId));
    } catch (error) {
        console.error(`Failed to delete time block ${blockId} from studio ${studioId}:`, error);
        throw error;
    }
}

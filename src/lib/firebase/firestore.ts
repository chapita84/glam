


import { db } from './config';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import type { Role } from '@/app/(app)/layout';
import type { BudgetItem as AIBudgetItem } from '@/app/(app)/budgets/actions';


// Type for role data stored in Firestore
type RoleFirestoreData = {
    id: string;
    name: string;
    permissions: string[]; // Stored as an array of strings
}

export type StaffMember = {
  id: string; // Corresponds to userId
  name: string;
  email: string;
  roleId: string;
  avatar: string; // Will be generated from name for now
  joinedAt?: any; 
};

export type Service = {
  id: string;
  name: string;
  category: string;
  duration: number; // in minutes
  price: number;
}

export type Client = {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export type Booking = {
    id?: string; // bookingId, optional for creation
    clientId: string;
    clientName: string;
    staffId: string;
    staffName: string;
    serviceId: string;
    serviceName: string;
    duration: number; // in minutes
    startTime: Date;
    endTime: Date;
    status: 'confirmed' | 'completed' | 'canceled_by_user' | 'canceled_by_tenant' | 'no_show';
    price: {
        amount: number;
        currency: string;
    };
    createdAt?: any;
    notes?: string;
}

// =================================================================
// Budget Module Types (New Specification)
// =================================================================

export type EventInfo = {
    type: string;
    date: string; // ISO string date
    time: string; // "HH:mm"
    location: string;
};

export type BudgetItem = {
    description: string;
    category: string;
    quantity: number;
    unitCost: {
        amount: number;
        currency: 'USD' | 'ARS';
    };
    duration?: number; // duration per unit in minutes
};

export type Summary = {
    subtotal: number;
    logistics: number;
    totalUSD: number;
    exchangeRate: number;
    totalARS: number;
};

export type Budget = {
    id?: string;
    budgetName: string;
    clientName: string;
    status: 'draft' | 'sent' | 'approved' | 'rejected';
    createdAt?: any;
    updatedAt?: any;
    eventInfo: EventInfo;
    items: BudgetItem[];
    summary: Summary;
    totalDuration?: number; // Calculated field, useful for booking
}

// =================================================================


export type WorkingHour = {
    dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    enabled: boolean;
}

export type TenantConfig = {
    workingHours: WorkingHour[];
}

/**
 * Fetches the configuration for a given tenant from Firestore.
 * @param tenantId The ID of the tenant.
 * @returns A promise that resolves to the TenantConfig object or null.
 */
export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    const configDocRef = doc(db, 'tenants', tenantId);
    try {
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Provide default working hours if they don't exist
            const workingHours = data.config?.workingHours ?? [
                { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', enabled: true },
                { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', enabled: true },
                { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', enabled: true },
                { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', enabled: true },
                { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', enabled: true },
                { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', enabled: false },
                { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', enabled: false },
            ];
            return {
                workingHours: workingHours.sort((a: WorkingHour, b: WorkingHour) => a.dayOfWeek - b.dayOfWeek),
            };
        } else {
             // Provide default working hours if the document doesn't exist
            return {
                workingHours: [
                    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', enabled: true },
                    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', enabled: true },
                    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', enabled: true },
                    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', enabled: true },
                    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', enabled: true },
                    { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', enabled: false },
                    { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', enabled: false },
                ].sort((a: WorkingHour, b: WorkingHour) => a.dayOfWeek - b.dayOfWeek),
            };
        }
    } catch (error) {
        console.error("Error fetching tenant config: ", error);
        return null;
    }
}

/**
 * Updates the configuration for a given tenant in Firestore.
 * @param tenantId The ID of the tenant.
 * @param config The new configuration object.
 */
export async function updateTenantConfig(tenantId: string, config: TenantConfig): Promise<void> {
    const configDocRef = doc(db, 'tenants', tenantId);
    try {
        await setDoc(configDocRef, { config }, { merge: true });
        console.log("Tenant config updated successfully.");
    } catch (error) {
        console.error("Error updating tenant config: ", error);
        throw error;
    }
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

/**
 * Fetches all staff members for a given tenant from Firestore.
 */
export async function getStaff(tenantId: string): Promise<StaffMember[]> {
    const staffCollectionRef = collection(db, 'tenants', tenantId, 'staff');
    try {
        const querySnapshot = await getDocs(staffCollectionRef);
        return querySnapshot.docs.map(doc => doc.data() as StaffMember);
    } catch (error) {
        console.error("Error fetching staff: ", error);
        return [];
    }
}

/**
 * Adds or updates a staff member in Firestore.
 */
export async function addOrUpdateStaffMember(tenantId: string, member: Omit<StaffMember, 'joinedAt' | 'avatar'>): Promise<void> {
    const staffDocRef = doc(db, 'tenants', tenantId, 'staff', member.id);
    try {
        // We simulate the full object here, in a real scenario the userId would be from Auth
        const memberData = {
            ...member,
            joinedAt: serverTimestamp() // Use server timestamp for consistency
        }
        await setDoc(staffDocRef, memberData, { merge: true });
        console.log("Staff member saved successfully: ", member.id);
    } catch (error) {
        console.error("Error saving staff member: ", error);
    }
}

/**
 * Deletes a staff member from Firestore.
 */
export async function deleteStaffMember(tenantId: string, userId: string): Promise<void> {
    const staffDocRef = doc(db, 'tenants', tenantId, 'staff', userId);
    try {
        await deleteDoc(staffDocRef);
        console.log("Staff member deleted successfully: ", userId);
    } catch (error) {
        console.error("Error deleting staff member: ", error);
    }
}

/**
 * Fetches all services for a given tenant from Firestore.
 */
export async function getServices(tenantId: string): Promise<Service[]> {
    const servicesCollectionRef = collection(db, 'tenants', tenantId, 'services');
    try {
        const querySnapshot = await getDocs(servicesCollectionRef);
        return querySnapshot.docs.map(doc => doc.data() as Service);
    } catch (error) {
        console.error("Error fetching services: ", error);
        return [];
    }
}

/**
 * Adds or updates a service in Firestore.
 */
export async function addOrUpdateService(tenantId: string, service: Service): Promise<void> {
    const serviceDocRef = doc(db, 'tenants', tenantId, 'services', service.id);
    try {
        await setDoc(serviceDocRef, service, { merge: true });
        console.log("Service saved successfully: ", service.id);
    } catch (error) {
        console.error("Error saving service: ", error);
    }
}

/**
 * Deletes a service from Firestore.
 */
export async function deleteService(tenantId: string, serviceId: string): Promise<void> {
    const serviceDocRef = doc(db, 'tenants', tenantId, 'services', serviceId);
    try {
        await deleteDoc(serviceDocRef);
        console.log("Service deleted successfully: ", serviceId);
    } catch (error) {
        console.error("Error deleting service: ", error);
    }
}


/**
 * Fetches all bookings for a given tenant from Firestore.
 * @param tenantId The ID of the tenant.
 * @returns A promise that resolves to an array of Booking objects.
 */
export async function getBookings(tenantId: string): Promise<Booking[]> {
    if (!tenantId) {
        console.log("getBookings called without a tenantId, returning empty array.");
        return [];
    }
    const bookingsCollectionRef = collection(db, 'tenants', tenantId, 'bookings');
    try {
        const querySnapshot = await getDocs(bookingsCollectionRef);
        const bookings = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            // Firestore timestamps need to be converted to JS Date objects
            const startTime = data.startTime?.toDate ? data.startTime.toDate() : new Date();
            const endTime = new Date(startTime.getTime() + data.duration * 60000);
            return {
                ...data,
                id: doc.id,
                startTime: startTime,
                endTime: endTime,
            } as Booking;
        });
        return bookings;
    } catch (error) {
        console.error("Error fetching bookings: ", error);
        return [];
    }
}

/**
 * Adds a new booking or updates an existing one in Firestore.
 * @param tenantId The ID of the tenant.
 * @param booking The booking object to add or update.
 */
export async function addOrUpdateBooking(tenantId: string, booking: Omit<Booking, 'createdAt' | 'endTime'> & { id?: string }): Promise<void> {
    // If no id is provided, a new one will be generated automatically by Firestore
    const bookingDocRef = booking.id 
        ? doc(db, 'tenants', tenantId, 'bookings', booking.id)
        : doc(collection(db, 'tenants', tenantId, 'bookings'));
    
    const bookingData = {
        ...booking,
        id: bookingDocRef.id,
        createdAt: serverTimestamp(),
    };

    try {
        await setDoc(bookingDocRef, bookingData, { merge: true });
        console.log("Booking saved successfully: ", bookingDocRef.id);
    } catch (error) {
        console.error("Error saving booking: ", error);
    }
}

/**
 * Deletes a booking from Firestore.
 * @param tenantId The ID of the tenant.
 * @param bookingId The ID of the booking to delete.
 */
export async function deleteBooking(tenantId: string, bookingId: string): Promise<void> {
    const bookingDocRef = doc(db, 'tenants', tenantId, 'bookings', bookingId);
    try {
        await deleteDoc(bookingDocRef);
        console.log("Booking deleted successfully: ", bookingId);
    } catch (error) {
        console.error("Error deleting booking: ", error);
    }
}

/**
 * Fetches all budgets for a given tenant from Firestore.
 */
export async function getBudgets(tenantId: string): Promise<Budget[]> {
    if (!tenantId) return [];
    const budgetsCollectionRef = collection(db, 'tenants', tenantId, 'budgets');
    const q = query(budgetsCollectionRef, orderBy('createdAt', 'desc'));
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Budget);
    } catch (error) {
        console.error("Error fetching budgets: ", error);
        return [];
    }
}

/**
 * Adds or updates a budget in Firestore.
 * @returns The ID of the saved budget.
 */
export async function addOrUpdateBudget(tenantId: string, budget: Omit<Budget, 'createdAt'|'updatedAt'> & {id?: string}): Promise<string> {
    const budgetDocRef = budget.id
        ? doc(db, 'tenants', tenantId, 'budgets', budget.id)
        : doc(collection(db, 'tenants', tenantId, 'budgets'));
    
    const budgetData = {
        ...budget,
        id: budgetDocRef.id,
        updatedAt: serverTimestamp(),
    };

    // Set createdAt only if it's a new document
    const finalData: any = { ...budgetData };
    if (!budget.id) {
        finalData.createdAt = serverTimestamp();
    }


    try {
        await setDoc(budgetDocRef, finalData, { merge: true });
        console.log("Budget saved successfully: ", budgetDocRef.id);
        return budgetDocRef.id;
    } catch (error) {
        console.error("Error saving budget: ", error);
        throw error;
    }
}

/**
 * Deletes a budget from Firestore.
 */
export async function deleteBudget(tenantId: string, budgetId: string): Promise<void> {
    const budgetDocRef = doc(db, 'tenants', tenantId, 'budgets', budgetId);
    try {
        await deleteDoc(budgetDocRef);
        console.log("Budget deleted successfully: ", budgetId);
    } catch (error) {
        console.error("Error deleting budget: ", error);
    }
}

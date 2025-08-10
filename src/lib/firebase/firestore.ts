
import { db } from './config';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import type { Role } from '@/app/(app)/layout';

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
    id: string; // bookingId
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
    createdAt: any;
    notes?: string;
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
 * Fetches all bookings for a given tenant from Firestore.
 * @param tenantId The ID of the tenant.
 * @returns A promise that resolves to an array of Booking objects.
 */
export async function getBookings(tenantId: string): Promise<Booking[]> {
    const bookingsCollectionRef = collection(db, 'tenants', tenantId, 'bookings');
    try {
        const querySnapshot = await getDocs(bookingsCollectionRef);
        const bookings = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                startTime: data.startTime.toDate(),
                endTime: data.endTime.toDate(),
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
export async function addOrUpdateBooking(tenantId: string, booking: Omit<Booking, 'id' | 'createdAt'> & { id?: string }): Promise<void> {
    const bookingId = booking.id || doc(collection(db, 'tenants', tenantId, 'bookings')).id;
    const bookingDocRef = doc(db, 'tenants', tenantId, 'bookings', bookingId);
    
    const bookingData = {
        ...booking,
        createdAt: serverTimestamp(),
    };
    delete bookingData.id;

    try {
        await setDoc(bookingDocRef, bookingData, { merge: true });
        console.log("Booking saved successfully: ", bookingId);
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

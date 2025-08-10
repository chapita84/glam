
import { db } from './config';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import type { Role, Permission } from '@/app/(app)/layout';
import type { BudgetItem as AIBudgetItem } from '@/app/(app)/budgets/actions';

// This is a temporary function to get all permission IDs for the owner role.
const getAllPermissionIds = (permissions: Permission[]): string[] => {
    let ids: string[] = [];
    permissions.forEach(p => {
        ids.push(p.id);
        if (p.children) {
            ids = ids.concat(getAllPermissionIds(p.children));
        }
    });
    return ids;
};


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
  avatar?: string;
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

const defaultWorkingHours: WorkingHour[] = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', enabled: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', enabled: true },
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', enabled: true },
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', enabled: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', enabled: true },
    { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', enabled: false },
    { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', enabled: false },
].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

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
            // Correctly access nested config object
            const workingHours = data.config?.workingHours;
            if (workingHours) {
                return {
                    workingHours: workingHours.sort((a: WorkingHour, b: WorkingHour) => a.dayOfWeek - b.dayOfWeek),
                };
            }
        }
        // If doc doesn't exist or has no config, return defaults
        return { workingHours: defaultWorkingHours };
    } catch (error) {
        console.error("Error fetching tenant config: ", error);
        return { workingHours: defaultWorkingHours };
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
        // Ensure we are saving into the nested 'config' object
        const configToSave = {
            ...config,
            workingHours: [...config.workingHours].sort((a,b) => {
                const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
                const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
                return dayA - dayB;
            })
        };
        await setDoc(configDocRef, { config: configToSave }, { merge: true });
        console.log("Tenant config updated successfully.");
    } catch (error) {
        console.error("Error updating tenant config: ", error);
        throw error;
    }
}


/**
 * Fetches all roles for a given tenant from Firestore.
 * If no roles exist, it seeds a default "Owner" role.
 * @param tenantId The ID of the tenant.
 * @returns A promise that resolves to an array of Role objects.
 */
export async function getRoles(tenantId: string): Promise<Role[]> {
    const rolesCollectionRef = collection(db, 'tenants', tenantId, 'roles');
    try {
        const querySnapshot = await getDocs(rolesCollectionRef);
        let roles: Role[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as RoleFirestoreData;
            roles.push({
                id: data.id,
                name: data.name,
                permissions: new Set(data.permissions || []),
            });
        });

        if (roles.length === 0) {
            console.log("No roles found, seeding 'Propietario' role...");
            const allPermissions: Permission[] = [
                { id: "agenda", label: "Agenda", children: [{ id: "agenda_view", label: "Ver" }, { id: "agenda_manage", label: "Gestionar" }] },
                { id: "management", label: "Gestión", children: [{ id: "services_manage", label: "Gestionar Servicios" }, { id: "staff_manage", label: "Gestionar Personal" }, { id: "budgets_manage", label: "Gestionar Presupuestos" }] },
                { id: "config", label: "Configuración", children: [{ id: "roles_manage", label: "Gestionar Roles" }, { id: "settings_manage", label: "Gestionar Ajustes" }, { id: "billing_manage", label: "Gestionar Facturación" }] },
                { id: "reports_view", label: "Ver Reportes" },
            ];
            const ownerRole = {
                id: 'owner',
                name: 'Propietario',
                permissions: getAllPermissionIds(allPermissions),
            };
            await addOrUpdateRole(tenantId, ownerRole);
            roles.push({ ...ownerRole, permissions: new Set(ownerRole.permissions) });
        }

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
export async function addOrUpdateRole(tenantId: string, role: {id: string, name: string, permissions: string[] | Set<string>}): Promise<void> {
    const roleDocRef = doc(db, 'tenants', tenantId, 'roles', role.id);
    const roleData: RoleFirestoreData = {
        id: role.id,
        name: role.name,
        permissions: Array.isArray(role.permissions) ? role.permissions : Array.from(role.permissions),
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
 * If no staff members exist, it seeds a default "Admin" user.
 */
export async function getStaff(tenantId: string): Promise<StaffMember[]> {
    const staffCollectionRef = collection(db, 'tenants', tenantId, 'staff');
    try {
        const querySnapshot = await getDocs(staffCollectionRef);
        const staff = querySnapshot.docs.map(doc => doc.data() as StaffMember);
        
        if (staff.length === 0) {
            console.log("No staff found, seeding default admin user...");
            const adminUser = {
                id: 'admin@example.com',
                name: 'Admin User',
                email: 'admin@example.com',
                roleId: 'owner',
            };
            await addOrUpdateStaffMember(tenantId, adminUser);
            staff.push(adminUser);
        }
        
        return staff;
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
 * If no services exist, it seeds some example services.
 */
export async function getServices(tenantId: string): Promise<Service[]> {
    const servicesCollectionRef = collection(db, 'tenants', tenantId, 'services');
    try {
        const querySnapshot = await getDocs(servicesCollectionRef);
        const services = querySnapshot.docs.map(doc => doc.data() as Service);

        if (services.length === 0) {
            console.log("No services found, seeding example services...");
            const defaultServices: Service[] = [
                { id: 'corte-de-pelo', name: 'Corte de Cabello', category: 'Peluquería', duration: 60, price: 50 },
                { id: 'manicura-clasica', name: 'Manicura Clásica', category: 'Uñas', duration: 30, price: 25 },
                { id: 'maquillaje', name: 'Maquillaje', category: 'Maquillaje', duration: 90, price: 75 },
            ];
            for (const service of defaultServices) {
                await addOrUpdateService(tenantId, service);
                services.push(service);
            }
        }
        return services;
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

        // Seed a booking if none exist, using seeded data
        if (bookings.length === 0) {
            console.log("No bookings found, attempting to seed an example booking...");
             const today = new Date();
             const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0); // Today at 2 PM

            const newBooking: Omit<Booking, 'id' | 'createdAt' | 'endTime'> = {
                clientName: "Cliente de Ejemplo",
                clientId: 'example-client',
                staffId: 'admin@example.com',
                staffName: "Admin User",
                serviceId: 'corte-de-pelo',
                serviceName: 'Corte de Cabello',
                duration: 60,
                startTime: startTime,
                status: 'confirmed',
                price: { amount: 50, currency: 'USD' },
                notes: 'Cita autogenerada de ejemplo.',
            };
            await addOrUpdateBooking(tenantId, newBooking);
            // We can just return the newly created booking to show it immediately
            return [{...newBooking, id: 'seeded-booking', endTime: new Date(startTime.getTime() + 60 * 60000)}];
        }

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
        const budgets = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Budget);

        if (budgets.length === 0) {
            console.log("No budgets found, seeding example budget...");
            const today = new Date();
            const eventDate = new Date(today.setDate(today.getDate() + 14)); // 2 weeks from now

            const newBudget: Budget = {
                budgetName: "Presupuesto Boda - Cliente Ejemplo",
                clientName: "Cliente de Ejemplo",
                status: 'draft',
                eventInfo: {
                    type: "Boda",
                    date: eventDate.toISOString().split('T')[0],
                    time: "17:00",
                    location: "Salón de Fiestas 'El Roble'",
                },
                items: [
                    { description: "Maquillaje de Novia", category: "Maquillaje", quantity: 1, unitCost: { amount: 250, currency: 'USD' }, duration: 120 },
                    { description: "Peinado de Novia", category: "Peluquería", quantity: 1, unitCost: { amount: 200, currency: 'USD' }, duration: 90 },
                ],
                summary: {
                    subtotal: 450,
                    logistics: 100,
                    totalUSD: 550,
                    exchangeRate: 900,
                    totalARS: 550 * 900,
                },
                totalDuration: 210,
            };
            const newBudgetId = await addOrUpdateBudget(tenantId, newBudget);
            return [{...newBudget, id: newBudgetId}];
        }

        return budgets;
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

    

    
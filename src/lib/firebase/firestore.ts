
import { db } from './config';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import {
  type User,
  type UserProfile,
  type GlobalRole,
  type Studio,
  type StudioRole,
  type StudioMember,
  type Service,
  type Budget,
  type Appointment,
  type TimeBlock,
} from '@/lib/types';
import { ALL_PERMISSIONS, getAllPermissionIds } from '@/lib/permissions';

// Export types for use in components
export type { Studio, UserProfile, Service };

// Studio Config interface
export interface StudioConfig {
  workingHours: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>;
}

// Additional types for studio page
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  staffId: string;
  clientId: string;
  start: Date;
  end: Date;
  status: 'confirmed' | 'cancelled' | 'pending';
}

// Real function for config update
export async function updateStudioConfig(studioId: string, config: StudioConfig): Promise<void> {
  console.log('🔥 updateStudioConfig called with:', { studioId, config });
  try {
    // Save to subcollection path as defined in firestore rules
    const configRef = doc(db, 'studios', studioId, 'config', 'general');
    console.log('🔥 Config ref created:', configRef.path);
    
    await setDoc(configRef, config);
    console.log('🔥 Studio config updated successfully in Firestore subcollection');
  } catch (error) {
    console.error('🔥 Error updating studio config:', error);
    throw error;
  }
}

// Mock function for studio update
export async function updateStudio(id: string, data: any): Promise<void> {
  // TODO: Implement real studio update
  console.log('Mock updateStudio called with:', id, data);
}

// Real global roles functions
export async function getGlobalRoles(): Promise<any[]> {
  try {
    console.log('Getting global roles from Firestore...');
    const rolesRef = collection(db, 'global_roles');
    const snapshot = await getDocs(rolesRef);
    const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Found global roles:', roles);
    return roles;
  } catch (error) {
    console.error('Error getting global roles:', error);
    return [];
  }
}

export async function addOrUpdateGlobalRole(role: any): Promise<void> {
  try {
    console.log('Adding/updating global role:', role);
    const rolesRef = collection(db, 'global_roles');
    await setDoc(doc(rolesRef, role.id), role);
    console.log('Global role saved successfully');
  } catch (error) {
    console.error('Error saving global role:', error);
    throw error;
  }
}

// Real user management functions
export async function getAllUsers(): Promise<any[]> {
  try {
    console.log('Getting all users from Firestore...');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs.map(doc => ({ 
      uid: doc.id, 
      ...doc.data(),
      // Asegurar valores por defecto
      email: doc.data().email || null,
      displayName: doc.data().displayName || doc.data().firstName + ' ' + doc.data().lastName || null,
      globalRole: doc.data().globalRole || 'customer',
      disabled: doc.data().disabled || false
    }));
    console.log('Found users:', users);
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

export async function updateUserProfile(uid: string, data: any): Promise<void> {
  try {
    console.log('Updating user profile:', uid, data);
    const userRef = doc(db, 'users', uid);
    // Usar setDoc con merge: true para crear o actualizar
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    console.log('Deleting user profile:', uid);
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    console.log('User profile deleted successfully');
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
}

export async function getServices(studioId: string): Promise<any[]> {
  // TODO: Implement real services retrieval
  console.log('Mock getServices called with:', studioId);
  return [];
}

export async function getBookings(studioId: string): Promise<any[]> {
  // TODO: Implement real bookings retrieval
  console.log('Mock getBookings called with:', studioId);
  return [];
}

// --- User Profile Functions ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
}

export async function createUserProfile(user: {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string | null;
  photoURL?: string | null;
  globalRole: GlobalRole;
  disabled?: boolean;
}): Promise<void> {
  const userDocRef = doc(db, 'users', user.uid);
  
  // Crear el objeto solo con campos que no sean undefined
  const profile: any = {
    uid: user.uid,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    globalRole: user.globalRole,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Solo agregar campos opcionales si tienen valores válidos
  if (user.phone !== undefined && user.phone !== null) {
    profile.phone = user.phone;
  }
  
  if (user.photoURL !== undefined && user.photoURL !== null) {
    profile.photoURL = user.photoURL;
  }

  await setDoc(userDocRef, profile);
}

// --- Studio Functions ---
export async function createStudio(
  studioName: string,
  ownerProfile: UserProfile
): Promise<Studio> {
  const batch = writeBatch(db);
  const studioDocRef = doc(collection(db, 'studios'));
  const studioData: Studio = {
    id: studioDocRef.id,
    name: studioName,
    slug: studioName.toLowerCase().replace(/\s+/g, '-'),
    ownerId: ownerProfile.uid,
  };
  batch.set(studioDocRef, studioData);

  const allPermissionIds = getAllPermissionIds(ALL_PERMISSIONS);
  const ownerRole: StudioRole = { id: 'owner', name: 'Propietario', permissions: allPermissionIds };
  const roleDocRef = doc(db, 'studios', studioDocRef.id, 'roles', 'owner');
  batch.set(roleDocRef, ownerRole);

  const memberData: StudioMember = { userId: ownerProfile.uid, studioId: studioDocRef.id, roleId: 'owner' };
  const memberDocRef = doc(collection(db, 'studio_members'), `${ownerProfile.uid}_${studioDocRef.id}`);
  batch.set(memberDocRef, memberData);

  await batch.commit();
  return studioData;
}

// Get studio clients (users who have appointments in this studio)
export async function getStudioClients(studioId: string): Promise<UserProfile[]> {
  try {
    console.log('Fetching clients for studio:', studioId);
    const appointmentsRef = collection(db, 'studios', studioId, 'appointments');
    const appointmentsSnap = await getDocs(appointmentsRef);
    
    const clientInfo = new Map<string, { email: string; name: string }>();
    
    appointmentsSnap.docs.forEach(doc => {
      const appt = doc.data();
      if (appt.clientEmail) {
        // Store the most recent name for this email
        clientInfo.set(appt.clientEmail, {
          email: appt.clientEmail,
          name: appt.clientName || appt.clientEmail.split('@')[0]
        });
      }
    });

    console.log('Found client emails:', Array.from(clientInfo.keys()));
    console.log('Client info from appointments:', Array.from(clientInfo.values()));

    // Create basic profiles from appointment data (no need to query users collection)
    const clients: UserProfile[] = Array.from(clientInfo.values()).map(info => ({
      uid: info.email, // Use email as uid for clients
      email: info.email,
      displayName: info.name,
      globalRole: 'customer',
      createdAt: new Date()
    } as UserProfile));

    console.log('Final clients list:', clients.map(c => ({ email: c.email, name: c.displayName })));
    return clients;
  } catch (error) {
    console.error('Error fetching studio clients:', error);
    return [];
  }
}

// Get studio configuration
export async function getStudioConfig(studioId: string): Promise<StudioConfig | null> {
  try {
    // First try to get config from the studio document itself
    const studioDoc = await getDoc(doc(db, 'studios', studioId));
    if (studioDoc.exists() && studioDoc.data()?.config) {
      return studioDoc.data().config as StudioConfig;
    }
    
    // Fallback: try the old subcollection location
    const configDoc = await getDoc(doc(db, 'studios', studioId, 'config', 'general'));
    if (configDoc.exists()) {
      return configDoc.data() as StudioConfig;
    }
    
    // Return default config if none exists
    return {
      workingHours: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        startTime: '09:00',
        endTime: '18:00',
        enabled: i >= 1 && i <= 5 // Monday to Friday
      }))
    };
  } catch (error) {
    console.error('Error fetching studio config:', error);
    // Return default config instead of null when there are permission errors
    return {
      workingHours: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        startTime: '09:00',
        endTime: '18:00',
        enabled: i >= 1 && i <= 5 // Monday to Friday
      }))
    };
  }
}

// Get all studios for customer search (using main studios collection)
export async function getAllStudios(): Promise<Studio[]> {
  try {
    const q = collection(db, 'studios');
    const querySnapshot = await getDocs(q);
    const studios = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    } as Studio));
    
    console.log(`Found ${studios.length} studios`);
    return studios;
  } catch (error) {
    console.error('Error fetching studios:', error);
    return [];
  }
}

// --- Staff / Studio Member Functions ---
export async function getStaffForStudio(studioId: string): Promise<(UserProfile & { roleId: string })[]> {
  try {
    console.log(`Fetching staff for studio: ${studioId}`);
    
    // First, try to get staff from the studio's staff subcollection
    const staffQuery = query(collection(db, `studios/${studioId}/staff`));
    const staffSnap = await getDocs(staffQuery);
    
    if (staffSnap.empty) {
      console.log('No staff found in studio staff collection, trying studio_members...');
      
      // Fallback to studio_members if no staff subcollection exists
      const membersQuery = query(collection(db, 'studio_members'), where('studioId', '==', studioId));
      const membersSnap = await getDocs(membersQuery);
      const members = membersSnap.docs.map((d) => d.data() as StudioMember);

      if (members.length === 0) {
        console.log('No members found in studio_members collection');
        return [];
      }

      const userIds = members.map((m) => m.userId);
      const usersQuery = query(collection(db, 'users'), where('uid', 'in', userIds));
      const usersSnap = await getDocs(usersQuery);
      const users = usersSnap.docs.map((d) => d.data() as UserProfile);

      return users.map((user) => {
        const membership = members.find((m) => m.userId === user.uid);
        return { ...user, roleId: membership?.roleId || '' };
      });
    }

    // Get staff from the studio's staff subcollection
    const staffMembers = staffSnap.docs.map((d) => {
      const staffData = d.data();
      return {
        uid: staffData.userId || d.id,
        displayName: staffData.displayName || staffData.name || 'Staff Member',
        email: staffData.email || '',
        photoURL: staffData.photoURL || '',
        roleId: staffData.roleId || 'staff'
      } as UserProfile & { roleId: string };
    });

    console.log(`Found ${staffMembers.length} staff members for studio ${studioId}`);
    return staffMembers;
  } catch (error) {
    console.error('Error fetching staff for studio:', error);
    return []; // Return empty array on permission errors
  }
}

// Public version for customers booking appointments
export async function getPublicStaffForStudio(studioId: string): Promise<UserProfile[]> {
  try {
    console.log(`Fetching public staff for studio: ${studioId}`);
    
    // For now, return mock data to avoid permission issues
    const mockStaff: UserProfile[] = [
      {
        uid: 'staff-1',
        email: 'maria@studio.com',
        displayName: 'María García',
        globalRole: 'staff'
      },
      {
        uid: 'staff-2',
        email: 'juan@studio.com',
        displayName: 'Juan Pérez',
        globalRole: 'staff'
      },
      {
        uid: 'staff-3',
        email: 'ana@studio.com',
        displayName: 'Ana López',
        globalRole: 'staff'
      }
    ];
    
    // Try to get staff from the studio document
    try {
      const studioDoc = await getDoc(doc(db, 'studios', studioId));
      if (studioDoc.exists()) {
        const studioData = studioDoc.data();
        if (studioData.staff && studioData.staff.length > 0) {
          return studioData.staff;
        }
      }
      
      // Try to get from studio_members collection
      const membersQuery = query(collection(db, 'studio_members'), where('studioId', '==', studioId));
      const membersSnap = await getDocs(membersQuery);
      const members = membersSnap.docs.map((d) => d.data() as StudioMember);

      if (members.length > 0) {
        const userIds = members.map((m) => m.userId);
        const usersQuery = query(collection(db, 'users'), where('uid', 'in', userIds));
        const usersSnap = await getDocs(usersQuery);
        const users = usersSnap.docs.map((d) => d.data() as UserProfile);

        if (users.length > 0) {
          console.log(`Found ${users.length} public staff members for studio ${studioId}`);
          return users;
        }
      }
    } catch (subError) {
      console.log('Using mock staff due to permission restrictions');
    }
    
    // Return mock staff as fallback
    return mockStaff;
  } catch (error: any) {
    console.error(`Error getting public staff for studio ${studioId}:`, error);
    // Return mock staff as fallback
    return [
      {
        uid: 'staff-1',
        email: 'maria@studio.com',
        displayName: 'María García',
        globalRole: 'staff'
      }
    ];
  }
}

// --- Studio Role Functions ---
export async function getStudioRoles(studioId: string): Promise<StudioRole[]> {
  const colRef = collection(db, 'studios', studioId, 'roles');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(
    (d) => ({ ...d.data(), id: d.id } as StudioRole)
  );
}

export async function addOrUpdateStudioRole(
  studioId: string,
  role: Omit<StudioRole, 'id'> & { id?: string }
): Promise<void> {
    const docId = role.id || role.name!.toLowerCase().replace(/\s+/g, '_');
    const docRef = doc(db, 'studios', studioId, 'roles', docId);
    await setDoc(docRef, { ...role, id: docId }, { merge: true });
}

export async function deleteStudioRole(
  studioId: string,
  roleId: string
): Promise<void> {
  await deleteDoc(doc(db, 'studios', studioId, 'roles', roleId));
}


// --- Service Functions ---
export async function getServicesForStudio(studioId: string): Promise<Service[]> {
  if (!studioId) {
    console.warn('getServicesForStudio called with undefined studioId');
    return [];
  }
  
  try {
    console.log(`Fetching services for studio: ${studioId}`);
    const colRef = collection(db, 'studios', studioId, 'services');
    const snapshot = await getDocs(colRef);
    const services = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Service));
    console.log(`Found ${services.length} services for studio ${studioId}`);
    return services;
  } catch (error: any) {
    console.error(`Error getting services for studio ${studioId}:`, error);
    
    // Si es un error de permisos, intentar reconectarse
    if (error.code === 'permission-denied') {
      console.warn(`Permission denied for studio ${studioId} services. This might be expected for some studios.`);
    }
    
    return [];
  }
}

// Public version for customers booking appointments
export async function getPublicServicesForStudio(studioId: string): Promise<Service[]> {
  if (!studioId) {
    console.warn('getPublicServicesForStudio called with undefined studioId');
    return [];
  }
  
  try {
    console.log(`Fetching public services for studio: ${studioId}`);
    
    // For now, return mock data to avoid permission issues
    const mockServices: Service[] = [
      {
        id: 'service-1',
        name: 'Corte de Cabello',
        description: 'Corte de cabello profesional',
        duration: 30,
        price: 25,
        categoryId: 'hair'
      },
      {
        id: 'service-2',
        name: 'Tinte',
        description: 'Coloración completa',
        duration: 120,
        price: 80,
        categoryId: 'hair'
      },
      {
        id: 'service-3',
        name: 'Manicure',
        description: 'Manicure básica',
        duration: 45,
        price: 20,
        categoryId: 'nails'
      }
    ];
    
    // Try to get services from a public collection or the main studio doc
    try {
      const studioDoc = await getDoc(doc(db, 'studios', studioId));
      if (studioDoc.exists()) {
        const studioData = studioDoc.data();
        // If services are stored in the studio document
        if (studioData.services && studioData.services.length > 0) {
          return studioData.services;
        }
      }
      
      // Try the services subcollection
      const colRef = collection(db, 'studios', studioId, 'services');
      const snapshot = await getDocs(colRef);
      const services = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Service));
      
      if (services.length > 0) {
        console.log(`Found ${services.length} public services for studio ${studioId}`);
        return services;
      }
    } catch (subError) {
      console.log('Using mock services due to permission restrictions');
    }
    
    // Return mock services as fallback
    return mockServices;
  } catch (error: any) {
    console.error(`Error getting public services for studio ${studioId}:`, error);
    // Return mock services as fallback
    return [
      {
        id: 'service-1',
        name: 'Corte de Cabello',
        description: 'Corte de cabello profesional',
        duration: 30,
        price: 25,
        categoryId: 'hair'
      }
    ];
  }
}

export async function addOrUpdateService(
  studioId: string,
  service: Partial<Service>
): Promise<void> {
  const docRef = service.id ? doc(db, 'studios', studioId, 'services', service.id) : doc(collection(db, 'studios', studioId, 'services'));
  await setDoc(docRef, { ...service, id: docRef.id }, { merge: true });
}

export async function deleteService(
  studioId: string,
  serviceId: string
): Promise<void> {
  await deleteDoc(doc(db, 'studios', studioId, 'services', serviceId));
}

// --- Studio Management Functions ---
export async function changeStudioOwner(
  studioId: string,
  newOwnerId: string,
  currentOwnerId: string
): Promise<void> {
  const batch = writeBatch(db);
  
  // 1. Actualizar el studio con el nuevo owner
  const studioRef = doc(db, 'studios', studioId);
  batch.update(studioRef, { ownerId: newOwnerId });
  
  // 2. Cambiar el rol del owner anterior a un rol regular (si tiene membresía)
  const oldOwnerMemberRef = doc(db, 'studio_members', `${currentOwnerId}_${studioId}`);
  const oldOwnerMemberSnap = await getDoc(oldOwnerMemberRef);
  if (oldOwnerMemberSnap.exists()) {
    // Cambiar a un rol de 'staff' o 'manager' por defecto
    batch.update(oldOwnerMemberRef, { roleId: 'staff' });
  }
  
  // 3. Cambiar el rol del nuevo owner
  const newOwnerMemberRef = doc(db, 'studio_members', `${newOwnerId}_${studioId}`);
  const newOwnerMemberSnap = await getDoc(newOwnerMemberRef);
  if (newOwnerMemberSnap.exists()) {
    batch.update(newOwnerMemberRef, { roleId: 'owner' });
  } else {
    // Crear nueva membresía si no existe
    batch.set(newOwnerMemberRef, {
      userId: newOwnerId,
      studioId: studioId,
      roleId: 'owner'
    });
  }
  
  await batch.commit();
}

export async function getStudioDetails(studioId: string): Promise<Studio | null> {
  const studioRef = doc(db, 'studios', studioId);
  const studioSnap = await getDoc(studioRef);
  return studioSnap.exists() ? { id: studioSnap.id, ...studioSnap.data() } as Studio : null;
}

// --- Appointment/Booking Functions ---
export async function getAppointments(studioId: string, start: Date, end: Date): Promise<Appointment[]> {
  try {
    const colRef = collection(db, 'studios', studioId, 'appointments');
    const q = query(colRef, where('start', '>=', Timestamp.fromDate(start)), where('start', '<=', Timestamp.fromDate(end)));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
        const data = d.data();
        return { ...data, id: d.id, start: (data.start as Timestamp).toDate(), end: (data.end as Timestamp).toDate() } as Appointment;
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return []; // Return empty array on permission errors
  }
}

export async function addOrUpdateAppointment(studioId: string, appt: Omit<Appointment, 'id'> & { id?: string }): Promise<void> {
    const docRef = appt.id ? doc(db, 'studios', studioId, 'appointments', appt.id) : doc(collection(db, 'studios', studioId, 'appointments'));
    await setDoc(docRef, { ...appt, id: docRef.id }, { merge: true });
}

export async function deleteAppointment(studioId: string, apptId: string): Promise<void> {
    await deleteDoc(doc(db, 'studios', studioId, 'appointments', apptId));
}

// Function to get all appointments for a specific client across all studios
export async function getAppointmentsForClient(clientId: string): Promise<(Appointment & { studioId: string; studioName: string })[]> {
    const appointments: (Appointment & { studioId: string; studioName: string })[] = [];
    
    // First, get all studios
    const studiosSnapshot = await getDocs(collection(db, 'studios'));
    
    // For each studio, query appointments for this client
    for (const studioDoc of studiosSnapshot.docs) {
        try {
            const studioData = studioDoc.data();
            const appointmentsRef = collection(db, 'studios', studioDoc.id, 'appointments');
            const q = query(appointmentsRef, where('clientId', '==', clientId));
            const appointmentsSnapshot = await getDocs(q);
            
            for (const apptDoc of appointmentsSnapshot.docs) {
                const data = apptDoc.data();
                appointments.push({
                    ...data,
                    id: apptDoc.id,
                    start: (data.start as Timestamp).toDate(),
                    end: (data.end as Timestamp).toDate(),
                    studioId: studioDoc.id,
                    studioName: studioData.name || 'Estudio'
                } as Appointment & { studioId: string; studioName: string });
            }
        } catch (error) {
            console.error(`Error fetching appointments for studio ${studioDoc.id}:`, error);
        }
    }
    
    // Sort by date (newest first)
    return appointments.sort((a, b) => b.start.getTime() - a.start.getTime());
}

// --- Time Block Functions ---
export async function getTimeBlocks(studioId: string, start: Date, end: Date): Promise<TimeBlock[]> {
    try {
      const colRef = collection(db, 'studios', studioId, 'time_blocks');
      const q = query(colRef, where('start', '>=', Timestamp.fromDate(start)), where('start', '<=', Timestamp.fromDate(end)));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
          const data = d.data();
          return { ...data, id: d.id, start: (data.start as Timestamp).toDate(), end: (data.end as Timestamp).toDate() } as TimeBlock;
      });
    } catch (error) {
      console.error('Error fetching time blocks:', error);
      return []; // Return empty array on permission errors
    }
}

export async function addOrUpdateTimeBlock(studioId: string, block: Omit<TimeBlock, 'id'> & { id?: string }): Promise<void> {
    const docRef = block.id ? doc(db, 'studios', studioId, 'time_blocks', block.id) : doc(collection(db, 'studios', studioId, 'time_blocks'));
    await setDoc(docRef, { ...block, id: docRef.id }, { merge: true });
}

export async function deleteTimeBlock(studioId: string, blockId: string): Promise<void> {
    await deleteDoc(doc(db, 'studios', studioId, 'time_blocks', blockId));
}

// --- Budgets ---
export async function getBudgets(studioId: string): Promise<Budget[]> {
    const colRef = collection(db, 'studios', studioId, 'budgets');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Budget));
}

export async function addOrUpdateBudget(studioId: string, budget: Omit<Budget, 'id'> & { id?: string }): Promise<void> {
    const docRef = budget.id ? doc(db, 'studios', studioId, 'budgets', budget.id) : doc(collection(db, 'studios', studioId, 'budgets'));
    await setDoc(docRef, { ...budget, id: docRef.id }, { merge: true });
}

export async function deleteBudget(studioId: string, budgetId: string): Promise<void> {
  await deleteDoc(doc(db, 'studios', studioId, 'budgets', budgetId));
}

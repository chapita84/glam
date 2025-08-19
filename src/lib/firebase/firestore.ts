
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
  type UserProfile,
  type Studio,
  type StudioRole,
  type StudioMember,
  type Service,
  type Budget,
  type Appointment,
  type TimeBlock,
} from '@/lib/types';
import { ALL_PERMISSIONS, getAllPermissionIds } from '@/lib/permissions';

// --- User Profile Functions ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
}

export async function createUserProfile(user: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  globalRole: 'owner' | 'customer' | 'superAdmin';
}): Promise<void> {
  const userDocRef = doc(db, 'users', user.uid);
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    globalRole: user.globalRole,
  };
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

// THIS IS THE FIX: Reads from the public collection
export async function getAllStudios(): Promise<Studio[]> {
  const q = query(collection(db, 'studios_public'), orderBy('name'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Studio);
}

// --- Staff / Studio Member Functions ---
export async function getStaffForStudio(studioId: string): Promise<(UserProfile & { roleId: string })[]> {
  const membersQuery = query(collection(db, 'studio_members'), where('studioId', '==', studioId));
  const membersSnap = await getDocs(membersQuery);
  const members = membersSnap.docs.map((d) => d.data() as StudioMember);

  if (members.length === 0) return [];

  const userIds = members.map((m) => m.userId);
  const usersQuery = query(collection(db, 'users'), where('uid', 'in', userIds));
  const usersSnap = await getDocs(usersQuery);
  const users = usersSnap.docs.map((d) => d.data() as UserProfile);

  return users.map((user) => {
    const membership = members.find((m) => m.userId === user.uid);
    return { ...user, roleId: membership?.roleId || '' };
  });
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
  const colRef = collection(db, 'studios', studioId, 'services');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Service));
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

// --- Appointment/Booking Functions ---
export async function getAppointments(studioId: string, start: Date, end: Date): Promise<Appointment[]> {
  const colRef = collection(db, 'studios', studioId, 'appointments');
  const q = query(colRef, where('start', '>=', Timestamp.fromDate(start)), where('start', '<=', Timestamp.fromDate(end)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
      const data = d.data();
      return { ...data, id: d.id, start: (data.start as Timestamp).toDate(), end: (data.end as Timestamp).toDate() } as Appointment;
  });
}

export async function addOrUpdateAppointment(studioId: string, appt: Omit<Appointment, 'id'> & { id?: string }): Promise<void> {
    const docRef = appt.id ? doc(db, 'studios', studioId, 'appointments', appt.id) : doc(collection(db, 'studios', studioId, 'appointments'));
    await setDoc(docRef, { ...appt, id: docRef.id }, { merge: true });
}

export async function deleteAppointment(studioId: string, apptId: string): Promise<void> {
    await deleteDoc(doc(db, 'studios', studioId, 'appointments', apptId));
}

// --- Time Block Functions ---
export async function getTimeBlocks(studioId: string, start: Date, end: Date): Promise<TimeBlock[]> {
    const colRef = collection(db, 'studios', studioId, 'time_blocks');
    const q = query(colRef, where('start', '>=', Timestamp.fromDate(start)), where('start', '<=', Timestamp.fromDate(end)));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
        const data = d.data();
        return { ...data, id: d.id, start: (data.start as Timestamp).toDate(), end: (data.end as Timestamp).toDate() } as TimeBlock;
    });
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

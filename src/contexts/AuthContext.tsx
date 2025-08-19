
'use client';

import {
  type PropsWithChildren,
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  type UserProfile,
  type Studio,
  type StudioRole,
  type StudioMember,
} from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { getAllPermissionIds, ALL_PERMISSIONS } from '@/lib/permissions';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  memberships: StudioMember[];
  currentStudio: Studio | null;
  currentStudioRole: StudioRole | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentStudio: (studio: Studio | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<StudioMember[]>([]);
  const [currentStudio, _setCurrentStudio] = useState<Studio | null>(null);
  const [currentStudioRole, setCurrentStudioRole] = useState<StudioRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const clearUserData = useCallback(() => {
    console.log("DEBUG: [clearUserData] Limpiando todos los datos de sesión.");
    setCurrentUser(null);
    setProfile(null);
    setMemberships([]);
    _setCurrentStudio(null);
    setCurrentStudioRole(null);
  }, []);
  
  const setCurrentStudio = useCallback(async (studio: Studio | null) => {
    console.log(`DEBUG: [setCurrentStudio] Intentando establecer estudio:`, studio);
    _setCurrentStudio(studio);
    setCurrentStudioRole(null);
    if (studio && profile) {
      if (profile.globalRole === 'superAdmin') {
        const allPermissions = getAllPermissionIds(ALL_PERMISSIONS);
        const superAdminRole = { id: 'superAdmin', name: 'Super Admin', permissions: allPermissions };
        console.log("DEBUG: [setCurrentStudio] Usuario es Super Admin. Asignando rol virtual:", superAdminRole);
        setCurrentStudioRole(superAdminRole);
        return;
      }
      const membership = memberships.find((m) => m.studioId === studio.id);
      if (membership) {
        console.log(`DEBUG: [setCurrentStudio] Membresía encontrada. Buscando rol ID: ${membership.roleId}`);
        const roleDocRef = doc(db, 'studios', studio.id, 'roles', membership.roleId);
        const roleDocSnap = await getDoc(roleDocRef);
        if (roleDocSnap.exists()) {
          const role = roleDocSnap.data() as StudioRole;
          console.log("DEBUG: [setCurrentStudio] Rol del estudio encontrado:", role);
          setCurrentStudioRole(role);
        } else {
          console.error(`DEBUG: [setCurrentStudio] ERROR: Rol no encontrado con ID ${membership.roleId}`);
        }
      } else {
        console.error(`DEBUG: [setCurrentStudio] ERROR: No se encontró membresía para el usuario ${profile.uid} en el estudio ${studio.id}`);
      }
    }
  }, [profile, memberships]);

  useEffect(() => {
    console.log("DEBUG: [AuthProvider] Montado. Configurando onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(`DEBUG: [onAuthStateChanged] Estado cambió. Usuario: ${user?.email || 'ninguno'}`);
      if (user) {
        // Do not set loading to true here, causes flicker
        setCurrentUser(user);
        try {
          const tokenResult = await user.getIdTokenResult(true);
          const isSuperAdmin = tokenResult.claims.superadmin === true;
          console.log(`DEBUG: [onAuthStateChanged] Es Super Admin: ${isSuperAdmin}`);

          if (isSuperAdmin) {
            setProfile({ uid: user.uid, email: user.email!, displayName: user.displayName || 'Super Admin', globalRole: 'superAdmin' });
            setMemberships([]);
          } else {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userProfile = userDocSnap.data() as UserProfile;
              console.log("DEBUG: [onAuthStateChanged] Perfil de Firestore encontrado:", userProfile);
              setProfile(userProfile);
              const membersQuery = query(collection(db, 'studio_members'), where('userId', '==', user.uid));
              const membersSnap = await getDocs(membersQuery);
              const userMemberships = membersSnap.docs.map((d) => d.data() as StudioMember);
              console.log(`DEBUG: [onAuthStateChanged] Membresías encontradas (${userMemberships.length}):`, userMemberships);
              setMemberships(userMemberships);
            } else {
              console.warn(`DEBUG: [onAuthStateChanged] Usuario ${user.email} sin perfil en Firestore. Deslogueando.`);
              await signOut(auth);
            }
          }
        } catch (error) {
          console.error("DEBUG: [onAuthStateChanged] ERROR CRÍTICO cargando datos. Deslogueando.", error);
          await signOut(auth);
        } finally {
          setLoading(false);
        }
      } else {
        clearUserData();
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [clearUserData]);

  useEffect(() => {
    console.log(`DEBUG: [RedirectionEffect] Verificando... Loading: ${loading}, Path: ${pathname}, currentUser: ${!!currentUser}, profile: ${!!profile}, currentStudio: ${!!currentStudio}`);
    if (loading) return;

    const publicRoutes = ['/login', '/register', '/search', '/forgot-password'];
    const isPublic = publicRoutes.some(p => pathname.startsWith(p));

    if (!currentUser) {
      if (!isPublic) {
        console.log("DEBUG: [RedirectionEffect] No hay usuario y no es página pública. Redirigiendo a /login");
        router.push('/login');
      }
      return;
    }

    if (profile) {
      if (isPublic) {
        console.log("DEBUG: [RedirectionEffect] Usuario logueado en página pública. Redirigiendo a /");
        router.push('/');
        return;
      }

      if (pathname === '/' && !currentStudio) {
        console.log("DEBUG: [RedirectionEffect] En página raíz, decidiendo siguiente paso...");
        const { globalRole } = profile;

        if (globalRole === 'superAdmin' || globalRole === 'customer' || (globalRole === 'owner' && memberships.length !== 1)) {
            console.log(`DEBUG: [RedirectionEffect] Rol ${globalRole} con ${memberships.length} membresías. Redirigiendo a /select-studio`);
            router.push('/select-studio');
        } else if (globalRole === 'owner' && memberships.length === 1) {
            console.log("DEBUG: [RedirectionEffect] Owner con 1 membresía. Auto-seleccionando y redirigiendo a /dashboard");
            getDoc(doc(db, 'studios', memberships[0].studioId)).then(studioSnap => {
                if (studioSnap.exists()) {
                    setCurrentStudio(studioSnap.data() as Studio).then(() => router.push('/dashboard'));
                }
            });
        }
      }
    }
  }, [currentUser, profile, memberships, currentStudio, loading, pathname, router, setCurrentStudio]);

  const login = async (email: string, pass: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, pass);
  };
  
  const logout = async () => {
    await signOut(auth);
  };

  const value = { currentUser, profile, memberships, currentStudio, currentStudioRole, loading, login, logout, setCurrentStudio };

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

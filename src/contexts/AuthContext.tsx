
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
import { getAllPermissionIds, ALL_PERMISSIONS, getGlobalRolePermissions } from '@/lib/permissions';

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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const clearUserData = useCallback(() => {
    console.log("DEBUG: [clearUserData] Limpiando todos los datos de sesión.");
    setCurrentUser(null);
    setProfile(null);
    setMemberships([]);
    _setCurrentStudio(null);
    setCurrentStudioRole(null);
    setIsRedirecting(false);
    // Limpiar localStorage al cerrar sesión
    localStorage.removeItem('superAdmin_selectedStudio');
  }, []);
  
  const setCurrentStudio = useCallback(async (studio: Studio | null) => {
    console.log(`DEBUG: [setCurrentStudio] Intentando establecer estudio:`, studio);
    _setCurrentStudio(studio);
    setCurrentStudioRole(null);
    
    // Para superAdmins, guardar el estudio seleccionado en localStorage
    if (profile?.globalRole === 'superAdmin') {
      if (studio) {
        localStorage.setItem('superAdmin_selectedStudio', JSON.stringify(studio));
      } else {
        localStorage.removeItem('superAdmin_selectedStudio');
      }
    }
    
    if (studio && profile) {
      if (profile.globalRole === 'superAdmin') {
        const allPermissions = getAllPermissionIds(ALL_PERMISSIONS);
        const superAdminRole = { id: 'superAdmin', name: 'Super Admin', permissions: allPermissions };
        console.log("DEBUG: [setCurrentStudio] Usuario es Super Admin. Asignando rol virtual:", superAdminRole);
        setCurrentStudioRole(superAdminRole);
        return;
      }
      
      if (profile.globalRole === 'customer') {
        // Los customers tienen permisos globales, no necesitan rol de estudio
        const customerPermissions = getGlobalRolePermissions('customer');
        const customerRole = { id: 'customer', name: 'Cliente', permissions: customerPermissions };
        console.log("DEBUG: [setCurrentStudio] Usuario es Customer. Asignando rol virtual:", customerRole);
        setCurrentStudioRole(customerRole);
        return;
      }
      
      // Para owner y staff, buscar membresía en el estudio
      const membership = memberships.find((m) => m.studioId === studio.id);
      if (membership) {
        console.log(`DEBUG: [setCurrentStudio] Membresía encontrada. Rol ID: ${membership.roleId}`);
        
        // Asignar permisos por defecto basados en el rol de la membresía
        let defaultPermissions: string[] = [];
        let roleName = '';
        
        if (membership.roleId === 'owner' || profile.globalRole === 'owner') {
          defaultPermissions = getGlobalRolePermissions('owner');
          roleName = 'Propietario';
        } else if (membership.roleId === 'staff' || profile.globalRole === 'staff') {
          defaultPermissions = getGlobalRolePermissions('staff');
          roleName = 'Personal';
        } else {
          // Fallback para otros roles
          defaultPermissions = getGlobalRolePermissions(profile.globalRole as 'owner' | 'staff');
          roleName = profile.globalRole === 'owner' ? 'Propietario' : 'Personal';
        }
        
        const defaultRole = { 
          id: membership.roleId, 
          name: roleName,
          permissions: defaultPermissions 
        };
        console.log("DEBUG: [setCurrentStudio] Asignando rol por defecto:", defaultRole);
        console.log("DEBUG: [setCurrentStudio] Permisos asignados:", defaultPermissions);
        setCurrentStudioRole(defaultRole);
      } else {
        // Usuario sin membresía explícita, asignar permisos por defecto basados en el rol global
        if (profile.globalRole === 'owner' || profile.globalRole === 'staff') {
          const defaultPermissions = getGlobalRolePermissions(profile.globalRole);
          const defaultRole = { 
            id: `default-${profile.globalRole}`, 
            name: profile.globalRole === 'owner' ? 'Propietario' : 'Personal',
            permissions: defaultPermissions 
          };
          console.log("DEBUG: [setCurrentStudio] Usuario sin membresía explícita. Asignando rol por defecto:", defaultRole);
          setCurrentStudioRole(defaultRole);
        } else {
          console.error(`DEBUG: [setCurrentStudio] ERROR: No se encontró membresía para el usuario ${profile.uid} en el estudio ${studio.id}`);
        }
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
            
            // Intentar recuperar el estudio guardado para superAdmins
            const savedStudio = localStorage.getItem('superAdmin_selectedStudio');
            if (savedStudio) {
              try {
                const studio = JSON.parse(savedStudio) as Studio;
                console.log("DEBUG: [onAuthStateChanged] Recuperando estudio guardado para SuperAdmin:", studio);
                await setCurrentStudio(studio);
              } catch (error) {
                console.error("DEBUG: [onAuthStateChanged] Error al recuperar estudio guardado:", error);
                localStorage.removeItem('superAdmin_selectedStudio');
              }
            }
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
    console.log(`DEBUG: [RedirectionEffect] Verificando... Loading: ${loading}, Path: ${pathname}, currentUser: ${!!currentUser}, profile: ${!!profile}, currentStudio: ${!!currentStudio}, isRedirecting: ${isRedirecting}`);
    if (loading || isRedirecting) return;

    const publicRoutes = ['/login', '/register', '/search', '/forgot-password'];
    const customerRoutes = ['/customer']; // Rutas específicas para customers
    const protectedRoutes = ['/dashboard', '/appointments', '/services', '/staff', '/budgets', '/settings']; // Rutas que requieren estudio seleccionado
    const isPublic = publicRoutes.some(p => pathname.startsWith(p));
    const isCustomerRoute = customerRoutes.some(p => pathname.startsWith(p));
    const isProtectedRoute = protectedRoutes.some(p => pathname.startsWith(p));

    if (!currentUser) {
      if (!isPublic && pathname !== '/') {
        console.log("DEBUG: [RedirectionEffect] No hay usuario y no es página pública. Redirigiendo a /login");
        setIsRedirecting(true);
        router.push('/login');
      }
      return;
    }

    if (profile) {
      if (isPublic) {
        console.log("DEBUG: [RedirectionEffect] Usuario logueado en página pública. Redirigiendo a /");
        setIsRedirecting(true);
        router.push('/');
        return;
      }

      // Verificar si el usuario está en la ruta correcta según su rol
      if (isCustomerRoute && profile.globalRole !== 'customer') {
        console.log("DEBUG: [RedirectionEffect] Usuario no-customer en ruta de customer. Redirigiendo a /");
        setIsRedirecting(true);
        router.push('/');
        return;
      }

      if (!isCustomerRoute && profile.globalRole === 'customer' && pathname !== '/') {
        console.log("DEBUG: [RedirectionEffect] Customer en ruta no permitida. Redirigiendo a /customer");
        setIsRedirecting(true);
        router.push('/customer');
        return;
      }

      if (pathname === '/' && !currentStudio) {
        console.log("DEBUG: [RedirectionEffect] En página raíz, decidiendo siguiente paso...");
        const { globalRole } = profile;

        if (globalRole === 'customer') {
            console.log("DEBUG: [RedirectionEffect] Usuario customer. Redirigiendo a /customer");
            setIsRedirecting(true);
            router.push('/customer');
        } else if (globalRole === 'superAdmin') {
            console.log("DEBUG: [RedirectionEffect] Super Admin. Redirigiendo a /select-studio");
            setIsRedirecting(true);
            router.push('/select-studio');
        } else if (globalRole === 'owner') {
            // Para owners, usar directamente las membresías ya cargadas
            console.log(`DEBUG: [RedirectionEffect] Owner detectado. Membresías: ${memberships.length}`);
            
            if (memberships.length === 1) {
              console.log("DEBUG: [RedirectionEffect] Owner con 1 membresía. Auto-seleccionando estudio...");
              setIsRedirecting(true);
              
              // Crear objeto de estudio básico usando solo el ID de la membresía
              const basicStudio = {
                id: memberships[0].studioId,
                name: 'Cargando...', // Se actualizará cuando se cargue el estudio completo
                slug: '',
                ownerId: profile.uid
              } as Studio;
              
              // Establecer el estudio inmediatamente para evitar bucles
              setCurrentStudio(basicStudio);
              router.push('/dashboard');
              setIsRedirecting(false);
            } else if (memberships.length > 1) {
              console.log(`DEBUG: [RedirectionEffect] Owner con ${memberships.length} membresías. Redirigiendo a /select-studio`);
              setIsRedirecting(true);
              router.push('/select-studio');
              setIsRedirecting(false);
            } else {
              console.log("DEBUG: [RedirectionEffect] Owner sin membresías. Redirigiendo a /onboarding/create-studio");
              setIsRedirecting(true);
              router.push('/onboarding/create-studio');
              setIsRedirecting(false);
            }
        } else if (globalRole === 'staff') {
            // Para staff, usar solo membresías
            if (memberships.length === 1) {
              console.log(`DEBUG: [RedirectionEffect] Staff con 1 membresía. Auto-seleccionando y redirigiendo a /dashboard`);
              setIsRedirecting(true);
              
              const autoSelectStudio = async () => {
                try {
                  const studioSnap = await getDoc(doc(db, 'studios', memberships[0].studioId));
                  if (studioSnap.exists()) {
                    await setCurrentStudio({ id: studioSnap.id, ...studioSnap.data() } as Studio);
                    router.push('/dashboard');
                  }
                } catch (error) {
                  console.error("DEBUG: [RedirectionEffect] Error auto-seleccionando estudio para staff:", error);
                  router.push('/select-studio');
                } finally {
                  setIsRedirecting(false);
                }
              };
              autoSelectStudio();
            } else if (memberships.length > 1) {
              console.log(`DEBUG: [RedirectionEffect] Staff con ${memberships.length} membresías. Redirigiendo a /select-studio`);
              setIsRedirecting(true);
              router.push('/select-studio');
            } else {
              console.log("DEBUG: [RedirectionEffect] Staff sin membresías. Redirigiendo a /select-studio");
              setIsRedirecting(true);
              router.push('/select-studio');
            }
        } else {
            console.log(`DEBUG: [RedirectionEffect] Caso no manejado: globalRole=${globalRole}`);
            setIsRedirecting(true);
            router.push('/select-studio');
        }
      }

      // Si ya tiene un estudio seleccionado, no hacer más redirecciones si ya está en una ruta protegida
      if (currentStudio && isProtectedRoute) {
        console.log("DEBUG: [RedirectionEffect] Usuario con estudio en ruta protegida, no redirigir");
        return;
      }

      // Si ya tiene un estudio seleccionado y está en la página raíz, redirigir al dashboard
      if (pathname === '/' && currentStudio) {
        console.log("DEBUG: [RedirectionEffect] Ya tiene estudio seleccionado. Redirigiendo a /dashboard");
        setIsRedirecting(true);
        router.push('/dashboard');
      }
    }
  }, [currentUser, profile, memberships, currentStudio, loading, pathname, router, isRedirecting]);

  // Reset redirecting flag when path changes (but not immediately)
  useEffect(() => {
    if (isRedirecting) {
      const timer = setTimeout(() => {
        setIsRedirecting(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, isRedirecting]);

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

import { type User, type UserProfile, type StudioRole } from './types';
import { getGlobalRolePermissions } from './permissions';

/**
 * Hook para verificar permisos del usuario actual
 */
export const usePermissions = (
  user: User | UserProfile | null,
  currentStudioRole: StudioRole | null
) => {
  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Super admin tiene todos los permisos
    if (user.globalRole === 'superAdmin') return true;

    // Para customers, usar permisos globales
    if (user.globalRole === 'customer') {
      const customerPermissions = getGlobalRolePermissions('customer');
      return customerPermissions.includes(permission);
    }

    // Para owner y staff, verificar rol del estudio
    if (currentStudioRole) {
      return currentStudioRole.permissions.includes(permission);
    }

    // Si no hay rol de estudio, verificar permisos globales por defecto
    const globalPermissions = getGlobalRolePermissions(user.globalRole);
    return globalPermissions.includes(permission);
  };

  /**
   * Verifica si el usuario puede acceder a una sección
   */
  const canAccess = (section: string): boolean => {
    return hasPermission(`${section}:view`) || hasPermission(section);
  };

  /**
   * Verifica si el usuario puede gestionar una sección
   */
  const canManage = (section: string): boolean => {
    return hasPermission(`${section}:manage`);
  };

  /**
   * Obtiene todos los permisos del usuario actual
   */
  const getUserPermissions = (): string[] => {
    if (!user) return [];

    if (user.globalRole === 'superAdmin') {
      // Super admin tiene todos los permisos
      return ['*']; // Wildcard para todos los permisos
    }

    if (user.globalRole === 'customer') {
      return getGlobalRolePermissions('customer');
    }

    if (currentStudioRole) {
      return currentStudioRole.permissions;
    }

    return getGlobalRolePermissions(user.globalRole);
  };

  return {
    hasPermission,
    canAccess,
    canManage,
    getUserPermissions,
  };
};

/**
 * Función standalone para verificar permisos sin hook
 */
export const checkPermission = (
  user: User | UserProfile | null,
  permission: string,
  currentStudioRole?: StudioRole | null
): boolean => {
  if (!user) return false;

  if (user.globalRole === 'superAdmin') return true;

  if (user.globalRole === 'customer') {
    const customerPermissions = getGlobalRolePermissions('customer');
    return customerPermissions.includes(permission);
  }

  if (currentStudioRole) {
    return currentStudioRole.permissions.includes(permission);
  }

  const globalPermissions = getGlobalRolePermissions(user.globalRole);
  return globalPermissions.includes(permission);
};

/**
 * Simple can function for use in components
 * @param user - The user profile  
 * @param studioRole - The user's role in the current studio
 * @param permission - The permission to check
 * @returns boolean indicating if the user has the permission
 */
export function can(
  user: UserProfile | null,
  studioRole: StudioRole | null, 
  permission: string
): boolean {
  return checkPermission(user, permission, studioRole);
}

/**
 * Checks if a user has any of the specified permissions
 * @param user - The user profile
 * @param studioRole - The user's role in the current studio  
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if the user has at least one permission
 */
export function canAny(
  user: UserProfile | null,
  studioRole: StudioRole | null,
  permissions: string[]
): boolean {
  return permissions.some(permission => can(user, studioRole, permission));
}

/**
 * Checks if a user has all of the specified permissions
 * @param user - The user profile
 * @param studioRole - The user's role in the current studio
 * @param permissions - Array of permissions to check  
 * @returns boolean indicating if the user has all permissions
 */
export function canAll(
  user: UserProfile | null,
  studioRole: StudioRole | null,
  permissions: string[]
): boolean {
  return permissions.every(permission => can(user, studioRole, permission));
}

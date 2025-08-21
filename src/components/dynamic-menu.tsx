// src/components/dynamic-menu.tsx

'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { can } from '@/lib/auth-utils';

export interface MenuItem {
  id: string;
  href?: string;
  label?: string; // Optional for dividers
  icon?: LucideIcon;
  permission?: string;
  permissions?: string[]; // Alternative: require ANY of these permissions
  requireAll?: string[]; // Alternative: require ALL of these permissions
  children?: MenuItem[];
  onClick?: () => void;
  className?: string;
  badge?: string | number;
  divider?: boolean; // Add a divider after this item
}

interface DynamicMenuProps {
  items: MenuItem[];
  children: (visibleItems: MenuItem[]) => ReactNode;
  className?: string;
}

interface ProtectedMenuItemProps {
  item: MenuItem;
  children: ReactNode;
}

/**
 * Hook to filter menu items based on user permissions
 */
export function useFilteredMenuItems(items: MenuItem[]): MenuItem[] {
  const { profile, currentStudioRole } = useAuth();

  const filterItems = (menuItems: MenuItem[]): MenuItem[] => {
    return menuItems
      .filter(item => {
        // If no permission specified, show the item
        if (!item.permission && !item.permissions && !item.requireAll) {
          return true;
        }

        // Check single permission
        if (item.permission) {
          return can(profile, currentStudioRole, item.permission);
        }

        // Check if user has ANY of the specified permissions
        if (item.permissions && item.permissions.length > 0) {
          return item.permissions.some(permission => 
            can(profile, currentStudioRole, permission)
          );
        }

        // Check if user has ALL of the specified permissions
        if (item.requireAll && item.requireAll.length > 0) {
          return item.requireAll.every(permission => 
            can(profile, currentStudioRole, permission)
          );
        }

        return false;
      })
      .map(item => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined
      }))
      .filter(item => 
        // Remove items that have children but all children were filtered out
        !item.children || item.children.length > 0
      );
  };

  return filterItems(items);
}

/**
 * Dynamic Menu Component that filters items based on user permissions
 */
export function DynamicMenu({ items, children, className }: DynamicMenuProps) {
  const visibleItems = useFilteredMenuItems(items);
  
  return (
    <div className={className}>
      {children(visibleItems)}
    </div>
  );
}

/**
 * Component to conditionally render menu items based on permissions
 */
export function ProtectedMenuItem({ item, children }: ProtectedMenuItemProps) {
  const { profile, currentStudioRole } = useAuth();

  // If no permission specified, show the item
  if (!item.permission && !item.permissions && !item.requireAll) {
    return <>{children}</>;
  }

  // Check single permission
  if (item.permission) {
    return can(profile, currentStudioRole, item.permission) ? <>{children}</> : null;
  }

  // Check if user has ANY of the specified permissions
  if (item.permissions && item.permissions.length > 0) {
    const hasPermission = item.permissions.some(permission => 
      can(profile, currentStudioRole, permission)
    );
    return hasPermission ? <>{children}</> : null;
  }

  // Check if user has ALL of the specified permissions
  if (item.requireAll && item.requireAll.length > 0) {
    const hasAllPermissions = item.requireAll.every(permission => 
      can(profile, currentStudioRole, permission)
    );
    return hasAllPermissions ? <>{children}</> : null;
  }

  return null;
}

/**
 * Simple wrapper for conditional rendering based on permissions
 */
interface ProtectedProps {
  permission?: string;
  permissions?: string[]; // User needs ANY of these
  requireAll?: string[]; // User needs ALL of these
  children: ReactNode;
  fallback?: ReactNode;
}

export function Protected({ 
  permission, 
  permissions, 
  requireAll, 
  children, 
  fallback = null 
}: ProtectedProps) {
  const { profile, currentStudioRole } = useAuth();

  // If no permission specified, show the content
  if (!permission && !permissions && !requireAll) {
    return <>{children}</>;
  }

  let hasAccess = false;

  // Check single permission
  if (permission) {
    hasAccess = can(profile, currentStudioRole, permission);
  }

  // Check if user has ANY of the specified permissions
  if (permissions && permissions.length > 0) {
    hasAccess = permissions.some(perm => 
      can(profile, currentStudioRole, perm)
    );
  }

  // Check if user has ALL of the specified permissions
  if (requireAll && requireAll.length > 0) {
    hasAccess = requireAll.every(perm => 
      can(profile, currentStudioRole, perm)
    );
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

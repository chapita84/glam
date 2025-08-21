// src/lib/menu-config.ts

import {
  CircleUser, 
  Calendar, 
  Settings, 
  Users, 
  Briefcase, 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  UserCog, 
  Landmark,
  Building,
  BarChart3
} from 'lucide-react';
import type { MenuItem } from '@/components/dynamic-menu';

/**
 * Main application menu configuration
 * Items are automatically filtered based on user permissions
 */
export const MAIN_MENU: MenuItem[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:view'
  },
  {
    id: 'appointments',
    href: '/appointments',
    label: 'Turnos',
    icon: Calendar,
    permission: 'appointments:view'
  },
  {
    id: 'services',
    href: '/services',
    label: 'Servicios',
    icon: Briefcase,
    permission: 'services:view'
  },
  {
    id: 'staff',
    href: '/staff',
    label: 'Staff',
    icon: Users,
    permission: 'staff:view'
  },
  {
    id: 'budgets',
    href: '/budgets',
    label: 'Presupuestos',
    icon: FileText,
    permission: 'budgets:view'
  },
  {
    id: 'billing',
    href: '/billing',
    label: 'Facturación',
    icon: CreditCard,
    permission: 'settings:manage-billing'
  },
  {
    id: 'divider-1',
    divider: true
  },
  {
    id: 'settings-section',
    label: 'Configuración',
    children: [
      {
        id: 'roles',
        href: '/roles',
        label: 'Roles de Estudio',
        icon: ShieldCheck,
        permission: 'settings:manage-roles'
      },
      {
        id: 'settings',
        href: '/settings',
        label: 'Configuración del Estudio',
        icon: Settings,
        permission: 'settings:manage-studio'
      }
    ]
  },
  {
    id: 'divider-2',
    divider: true
  },
  {
    id: 'admin-section',
    label: 'Administración Global',
    children: [
      {
        id: 'admin-users',
        href: '/admin/users',
        label: 'Usuarios',
        icon: UserCog,
        permission: 'admin:manage-users'
      },
      {
        id: 'admin-roles',
        href: '/admin/roles',
        label: 'Roles Globales',
        icon: ShieldCheck,
        permission: 'admin:manage-roles'
      },
      {
        id: 'admin-studios',
        href: '/admin/studio-management',
        label: 'Gestión de Estudios',
        icon: Landmark,
        permission: 'admin:manage-studios'
      },
      {
        id: 'admin-analytics',
        href: '/admin/analytics',
        label: 'Analíticas del Sistema',
        icon: BarChart3,
        permission: 'admin:view-analytics'
      }
    ]
  }
];

/**
 * Customer-specific menu for client portal
 */
export const CUSTOMER_MENU: MenuItem[] = [
  {
    id: 'customer-appointments',
    href: '/customer/appointments',
    label: 'Mis Turnos',
    icon: Calendar,
    permission: 'customer:view-appointments'
  },
  {
    id: 'customer-book',
    href: '/customer/book',
    label: 'Reservar Turno',
    icon: Calendar,
    permission: 'customer:book-appointments'
  },
  {
    id: 'customer-profile',
    href: '/customer/profile',
    label: 'Mi Perfil',
    icon: CircleUser,
    permission: 'customer:view-profile'
  }
];

/**
 * Quick actions menu for floating action button or toolbar
 */
export const QUICK_ACTIONS: MenuItem[] = [
  {
    id: 'quick-appointment',
    label: 'Nueva Cita',
    icon: Calendar,
    permission: 'appointments:manage',
    onClick: () => {
      // Handle quick appointment creation
    }
  },
  {
    id: 'quick-service',
    label: 'Nuevo Servicio',
    icon: Briefcase,
    permission: 'services:manage',
    onClick: () => {
      // Handle quick service creation
    }
  },
  {
    id: 'quick-staff',
    label: 'Invitar Staff',
    icon: Users,
    permission: 'staff:manage',
    onClick: () => {
      // Handle staff invitation
    }
  }
];

/**
 * Settings submenu for detailed configuration options
 */
export const SETTINGS_MENU: MenuItem[] = [
  {
    id: 'studio-settings',
    href: '/settings',
    label: 'Configuración del Estudio',
    icon: Building,
    permission: 'settings:manage-studio'
  },
  {
    id: 'roles-settings',
    href: '/roles',
    label: 'Roles y Permisos',
    icon: ShieldCheck,
    permission: 'settings:manage-roles'
  },
  {
    id: 'billing-settings',
    href: '/billing',
    label: 'Facturación y Suscripción',
    icon: CreditCard,
    permission: 'settings:manage-billing'
  }
];

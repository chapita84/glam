// src/lib/permissions.ts

import type { Permission } from './types';

/**
 * Defines the hierarchical structure of all available permissions in the application.
 * This structure is used to build the permissions tree in the UI.
 */
export const ALL_PERMISSIONS: Permission[] = [
    {
        id: "dashboard",
        name: "dashboard", 
        label: "Dashboard",
        children: [
            { id: "dashboard:view", name: "dashboard:view", label: "Ver Dashboard" },
            { id: "dashboard:view-analytics", name: "dashboard:view-analytics", label: "Ver Analíticas" },
        ],
    },
    {
        id: "appointments",
        name: "appointments",
        label: "Turnos",
        children: [
            { id: "appointments:view", name: "appointments:view", label: "Ver Calendario" },
            { id: "appointments:manage", name: "appointments:manage", label: "Gestionar Turnos (Crear/Editar/Cancelar)" },
            { id: "appointments:block-time", name: "appointments:block-time", label: "Bloquear Horarios" },
        ],
    },
    {
        id: "services",
        name: "services",
        label: "Servicios",
        children: [
            { id: "services:view", name: "services:view", label: "Ver Servicios" },
            { id: "services:manage", name: "services:manage", label: "Gestionar Servicios (Crear/Editar/Eliminar)" },
        ],
    },
    {
        id: "staff",
        name: "staff",
        label: "Personal (Staff)",
        children: [
            { id: "staff:view", name: "staff:view", label: "Ver Miembros del Equipo" },
            { id: "staff:manage", name: "staff:manage", label: "Gestionar Miembros (Invitar/Editar/Eliminar)" },
        ],
    },
    {
        id: "budgets",
        name: "budgets",
        label: "Presupuestos",
        children: [
            { id: "budgets:view", name: "budgets:view", label: "Ver Presupuestos" },
            { id: "budgets:manage", name: "budgets:manage", label: "Gestionar Presupuestos (Crear/Editar/Enviar)" },
            { id: "budgets:generate-ai", name: "budgets:generate-ai", label: "Usar Asistente de IA" },
        ],
    },
    {
        id: "settings",
        name: "settings",
        label: "Configuración del Estudio",
        children: [
            { id: "settings:manage-studio", name: "settings:manage-studio", label: "Editar Información del Estudio" },
            { id: "settings:manage-roles", name: "settings:manage-roles", label: "Gestionar Roles y Permisos" },
            { id: "settings:manage-billing", name: "settings:manage-billing", label: "Gestionar Facturación y Suscripción" },
        ],
    },
    {
        id: "customer",
        name: "customer",
        label: "Cliente",
        children: [
            { id: "customer:view-services", name: "customer:view-services", label: "Ver Servicios Disponibles" },
            { id: "customer:book-appointments", name: "customer:book-appointments", label: "Reservar Turnos" },
            { id: "customer:view-appointments", name: "customer:view-appointments", label: "Ver Mis Turnos" },
            { id: "customer:cancel-appointments", name: "customer:cancel-appointments", label: "Cancelar Mis Turnos" },
            { id: "customer:view-profile", name: "customer:view-profile", label: "Ver Mi Perfil" },
            { id: "customer:edit-profile", name: "customer:edit-profile", label: "Editar Mi Perfil" },
        ],
    },
    {
        id: "admin",
        name: "admin",
        label: "Administración Global",
        children: [
            { id: "admin:manage-users", name: "admin:manage-users", label: "Gestionar Usuarios del Sistema" },
            { id: "admin:manage-roles", name: "admin:manage-roles", label: "Gestionar Roles Globales" },
            { id: "admin:manage-studios", name: "admin:manage-studios", label: "Gestionar Estudios y Propietarios" },
            { id: "admin:view-analytics", name: "admin:view-analytics", label: "Ver Analíticas del Sistema" },
            { id: "admin:manage-system", name: "admin:manage-system", label: "Configuración del Sistema" },
        ],
    },
];

/**
 * Flattens the hierarchical permission structure into a simple array of all permission IDs.
 * @param permissions - The array of permissions to flatten.
 * @returns A flat array of all permission IDs.
 */
export const getAllPermissionIds = (permissions: Permission[]): string[] => {
    let ids: string[] = [];
    for (const permission of permissions) {
        ids.push(permission.id);
        if (permission.children) {
            ids = ids.concat(getAllPermissionIds(permission.children));
        }
    }
    return ids;
};

/**
 * Gets default permissions for each global role
 */
export const getGlobalRolePermissions = (role: 'superAdmin' | 'owner' | 'staff' | 'customer'): string[] => {
    switch (role) {
        case 'superAdmin':
            return getAllPermissionIds(ALL_PERMISSIONS);
        
        case 'owner':
            return [
                'dashboard:view',
                'dashboard:view-analytics',
                'appointments:view',
                'appointments:manage',
                'appointments:block-time',
                'services:view',
                'services:manage',
                'staff:view',
                'staff:manage',
                'budgets:view',
                'budgets:manage',
                'budgets:generate-ai',
                'settings:manage-studio',
                'settings:manage-roles',
                'settings:manage-billing',
            ];
            
        case 'staff':
            return [
                'dashboard:view',
                'appointments:view',
                'appointments:manage',
                'services:view',
                'budgets:view',
            ];
            
        case 'customer':
            return [
                'customer:view-services',
                'customer:book-appointments', 
                'customer:view-appointments',
                'customer:cancel-appointments',
                'customer:view-profile',
                'customer:edit-profile',
            ];
            
        default:
            return [];
    }
};

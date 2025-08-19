// src/lib/permissions.ts

import type { Permission } from './types';

/**
 * Defines the hierarchical structure of all available permissions in the application.
 * This structure is used to build the permissions tree in the UI.
 */
export const ALL_PERMISSIONS: Permission[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        children: [
            { id: "dashboard:view", label: "Ver Dashboard" },
            { id: "dashboard:view-analytics", label: "Ver Analíticas" },
        ],
    },
    {
        id: "appointments",
        label: "Turnos",
        children: [
            { id: "appointments:view", label: "Ver Calendario" },
            { id: "appointments:manage", label: "Gestionar Turnos (Crear/Editar/Cancelar)" },
            { id: "appointments:block-time", label: "Bloquear Horarios" },
        ],
    },
    {
        id: "services",
        label: "Servicios",
        children: [
            { id: "services:view", label: "Ver Servicios" },
            { id: "services:manage", label: "Gestionar Servicios (Crear/Editar/Eliminar)" },
        ],
    },
    {
        id: "staff",
        label: "Personal (Staff)",
        children: [
            { id: "staff:view", label: "Ver Miembros del Equipo" },
            { id: "staff:manage", label: "Gestionar Miembros (Invitar/Editar/Eliminar)" },
        ],
    },
    {
        id: "budgets",
        label: "Presupuestos",
        children: [
            { id: "budgets:view", label: "Ver Presupuestos" },
            { id: "budgets:manage", "label": "Gestionar Presupuestos (Crear/Editar/Enviar)" },
            { id: "budgets:generate-ai", label: "Usar Asistente de IA" },
        ],
    },
    {
        id: "settings",
        label: "Configuración del Estudio",
        children: [
            { id: "settings:manage-studio", label: "Editar Información del Estudio" },
            { id: "settings:manage-roles", label: "Gestionar Roles y Permisos" },
            { id: "settings:manage-billing", label: "Gestionar Facturación y Suscripción" },
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

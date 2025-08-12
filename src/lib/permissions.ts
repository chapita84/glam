import type { Permission } from "@/app/(app)/layout";

export const ALL_PERMISSIONS: Permission[] = [
    { 
        id: "agenda", 
        label: "Agenda", 
        children: [
            { id: "agenda_view", label: "Ver" }, 
            { id: "agenda_manage", label: "Gestionar Citas" },
            { id: "agenda_block", label: "Bloquear Horarios" },
            { id: "agenda_block_delete", label: "Eliminar Bloqueos" }
        ] 
    },
    { 
        id: "management", 
        label: "Gestión", 
        children: [
            { id: "services_manage", label: "Gestionar Servicios" }, 
            { id: "staff_manage", label: "Gestionar Personal" }, 
            { id: "budgets_manage", label: "Gestionar Presupuestos" },
            { id: "studios_manage", label: "Gestionar Estudios" }
        ] 
    },
    { 
        id: "config", 
        label: "Configuración", 
        children: [
            { id: "roles_manage", label: "Gestionar Roles" }, 
            { id: "settings_manage", label: "Gestionar Ajustes" }, 
            { id: "billing_manage", label: "Gestionar Facturación" }
        ] 
    },
    { id: "reports_view", label: "Ver Reportes" },
];

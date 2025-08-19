
'use client';

import {
    CircleUser, Calendar, Settings, Users, Briefcase, LayoutDashboard, LogOut, UserCog, ShieldCheck, FileText, CreditCard, Search, Landmark
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { ReactNode, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { getAllPermissionIds, ALL_PERMISSIONS } from '@/lib/permissions';

const allNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
    { href: '/appointments', label: 'Turnos', icon: Calendar, permission: 'appointments:view' },
    { href: '/services', label: 'Servicios', icon: Briefcase, permission: 'services:view' },
    { href: '/staff', label: 'Staff', icon: Users, permission: 'staff:view' },
    { href: '/budgets', label: 'Presupuestos', icon: FileText, permission: 'budgets:view' },
    { href: '/billing', label: 'Facturación', icon: CreditCard, permission: 'settings:manage-billing' },
    { href: '/roles', label: 'Roles de Estudio', icon: ShieldCheck, permission: 'settings:manage-roles' },
    { href: '/settings', label: 'Configuración', icon: Settings, permission: 'settings:manage-studio' },
    { href: '/admin/users', label: 'Usuarios', icon: UserCog, permission: 'admin:manage-users' },
    { href: '/admin/roles', label: 'Roles Globales', icon: ShieldCheck, permission: 'admin:manage-roles' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
    console.log("DEBUG: Renderizando AppLayout");
    const pathname = usePathname();
    const { 
        currentUser, 
        profile,
        currentStudio,
        currentStudioRole,
        logout, 
        loading: authLoading 
    } = useAuth();
    const router = useRouter();

    const accessibleNavItems = useMemo(() => {
        console.log("DEBUG: [useMemo accessibleNavItems] Recalculando menú...");
        if (!profile) {
            console.log("DEBUG: [useMemo accessibleNavItems] No hay perfil, menú vacío.");
            return [];
        }

        if (profile.globalRole === 'superAdmin') {
            console.log("DEBUG: [useMemo accessibleNavItems] Es Super Admin, mostrando items de admin.");
            const allPermissions = new Set(getAllPermissionIds(ALL_PERMISSIONS));
            allPermissions.add('admin:manage-users');
            allPermissions.add('admin:manage-roles');
            return allNavItems.filter(item => allPermissions.has(item.permission));
        }

        if (currentStudioRole?.permissions) {
             const userPermissions = new Set(currentStudioRole.permissions);
             console.log("DEBUG: [useMemo accessibleNavItems] Permisos del rol de estudio:", userPermissions);
             const items = allNavItems.filter(item => userPermissions.has(item.permission));
             console.log("DEBUG: [useMemo accessibleNavItems] Items de menú accesibles:", items);
             return items;
        }
        
        console.log("DEBUG: [useMemo accessibleNavItems] No se cumplió ninguna condición, menú vacío.");
        return [];
    }, [profile, currentStudioRole]);

    if (authLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }
    
    if (!currentUser) return null;

    return (
        <SidebarProvider collapsible="full"> 
            <div className="grid h-screen w-full lg:grid-cols-[280px_1fr]">
                <Sidebar>
                    <SidebarHeader>
                        <h1 className="text-2xl font-bold">GlamDash</h1>
                        {currentStudio ? <p className="text-sm text-muted-foreground">{currentStudio.name}</p> : <p className="text-sm text-muted-foreground">Menú Principal</p>}
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {accessibleNavItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton 
                                        href={item.href} 
                                        label={item.label} 
                                        icon={item.icon} 
                                        isActive={pathname.startsWith(item.href)} 
                                    />
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start gap-3">
                                    <CircleUser className="h-6 w-6" />
                                    <span>{profile?.displayName || currentUser.email}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/select-studio')}>
                                    <Landmark className="mr-2 h-4 w-4" />
                                    <span>Cambiar Estudio</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarFooter>
                </Sidebar>
                <main className="flex flex-col h-full overflow-y-auto p-6 bg-muted/20">
                    {children}
                </main>
                <Toaster />
            </div>
        </SidebarProvider>
    );
}



'use client'

import type { PropsWithChildren } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { getRoles, getStaff, getServices, getBookings, getTenantConfig, type StaffMember, type Service, type Booking, type TenantConfig } from '@/lib/firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Users,
  Fingerprint,
  Wand2,
  LogOut,
  CircleUser,
  Settings,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Panel" },
    { href: "/appointments", icon: Calendar, label: "Citas" },
    { href: "/services", icon: Sparkles, label: "Servicios" },
    { href: "/staff", icon: Users, label: "Personal" },
    { href: "/roles", icon: Fingerprint, label: "Roles" },
    { href: "/budgets", icon: Wand2, label: "Presupuestos" },
]

export type Permission = {
  id: string;
  label: string;
};

export type Role = {
  id: string;
  name: string;
  permissions: Set<string>;
};

// This seems to be a business logic constant for now.
export const allPermissions: Permission[] = [
    { id: "agenda_view", label: "Ver Agenda" },
    { id: "agenda_manage", label: "Gestionar Agenda" },
    { id: "services_manage", label: "Gestionar Servicios" },
    { id: "staff_manage", label: "Gestionar Personal" },
    { id: "reports_view", label: "Ver Reportes" },
];


export default function AppLayout({ children }: PropsWithChildren) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { setTheme } = useTheme();

  // Using a mock tenantId for now.
  const tenantId = "test-tenant";

  const refreshData = useCallback(async () => {
    setLoading(true);
    const [fetchedRoles, fetchedStaff, fetchedServices, fetchedBookings, fetchedConfig] = await Promise.all([
      getRoles(tenantId),
      getStaff(tenantId),
      getServices(tenantId),
      getBookings(tenantId),
      getTenantConfig(tenantId),
    ]);
    setRoles(fetchedRoles);
    setStaff(fetchedStaff);
    setServices(fetchedServices);
    setBookings(fetchedBookings);
    setConfig(fetchedConfig);
    setLoading(false);
  }, [tenantId]);
  
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore - cloning child to pass props
      return React.cloneElement(child, { 
          roles, 
          staff,
          services,
          bookings,
          config,
          allPermissions, 
          refreshData, 
          loading,
          tenantId 
      });
    }
    return child;
  });

  const mainContentPadding = 'p-4 sm:px-6 sm:py-6';
  
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <Fingerprint className="w-8 h-8 text-sidebar-primary" />
                <h1 className="text-xl font-semibold text-sidebar-primary tracking-wider group-data-[collapsible=icon]:hidden">
                    GlamDash
                </h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label} isActive={pathname.startsWith(item.href)}>
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cerrar Sesión">
                    <Link href="/login">
                        <LogOut />
                        <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div/>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar>
                    <AvatarImage src="https://placehold.co/32x32.png" alt="User avatar" />
                    <AvatarFallback>
                        <CircleUser />
                    </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Ajustes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                      <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span>Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Claro</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Oscuro</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                          <Laptop className="mr-2 h-4 w-4" />
                          <span>Sistema</span>
                      </DropdownMenuItem>
                  </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className={`flex-1 ${mainContentPadding}`}>{loading ? <p>Cargando datos...</p> : childrenWithProps}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

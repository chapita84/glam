
'use client'

import type { PropsWithChildren } from 'react';
import React from 'react';
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
  Laptop,
  CreditCard,
  Building,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { StudioProvider, useStudio } from '@/contexts/StudioContext';
import { StudioDataProvider, useStudioData } from '@/contexts/StudioDataContext';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Panel" },
    { href: "/appointments", icon: Calendar, label: "Citas" },
    { href: "/services", icon: Sparkles, label: "Servicios" },
    { href: "/staff", icon: Users, label: "Personal" },
    { href: "/roles", icon: Fingerprint, label: "Roles" },
    { href: "/budgets", icon: Wand2, label: "Presupuestos" },
    { href: "/billing", icon: CreditCard, label: "Facturación" },
    { href: "/studio", icon: Building, label: "Estudio" },
    { href: "/settings", icon: Settings, label: "Ajustes" },
]

const adminNavItems = [
    { href: "/admin", icon: Shield, label: "Admin Panel" },
]

function AppLayoutContent({ children }: PropsWithChildren) {
    const pathname = usePathname();
    const { setTheme } = useTheme();
    const { studio, loading: studioLoading } = useStudio();
    const { loading: studioDataLoading, currentUser } = useStudioData();
    
    const hasCustomPadding = pathname.startsWith('/appointments');

    if (currentUser?.globalRole !== 'superAdmin' && (studioLoading || !studio) && pathname !== '/select-studio') {
        return <div className="flex h-screen w-full items-center justify-center"><p>Cargando estudio...</p></div>;
    }

    const sidebarTitle = currentUser?.globalRole === 'superAdmin' ? 'Admin Panel' : (studio?.name || 'Glam&Beauty');

    return (
        <SidebarProvider collapsible="icon">
            <div className="grid h-screen w-full lg:grid-cols-[280px_1fr]">
                <Sidebar side="left" variant="sidebar" className="hidden lg:block">
                    <SidebarHeader>
                        <div className="flex items-center gap-2 p-2">
                            <Sparkles className="w-8 h-8 text-sidebar-primary" />
                            <h1 className="text-xl font-semibold text-sidebar-primary tracking-wider group-data-[collapsed=true]:hidden">
                                {sidebarTitle}
                            </h1>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {currentUser?.globalRole !== 'superAdmin' && navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton 
                                        href={item.href}
                                        label={item.label}
                                        icon={item.icon}
                                        isActive={pathname.startsWith(item.href)}
                                    />
                                </SidebarMenuItem>
                            ))}
                            {currentUser?.globalRole === 'superAdmin' && (
                                <>
                                    <DropdownMenuSeparator className="my-4" />
                                    {adminNavItems.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton 
                                                href={item.href}
                                                label={item.label}
                                                icon={item.icon}
                                                isActive={pathname.startsWith(item.href)}
                                            />
                                        </SidebarMenuItem>
                                    ))}
                                </>
                            )}
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                 <SidebarMenuButton 
                                    href="/login"
                                    label="Cerrar Sesión"
                                    icon={LogOut}
                                />
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>
                 <div className="flex flex-col h-screen">
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 lg:justify-end flex-shrink-0">
                        <SidebarTrigger className="lg:hidden" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="overflow-hidden rounded-full"
                                >
                                    <Avatar>
                                        <AvatarImage src={currentUser?.photoURL || "https://placehold.co/32x32.png"} alt="User avatar" />
                                        <AvatarFallback>
                                            <CircleUser />
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{currentUser?.displayName || 'Mi Cuenta'}</DropdownMenuLabel>
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
                    <main className="flex-1 overflow-hidden">
                        <div className={cn("h-full", !hasCustomPadding && "overflow-y-auto p-4 md:p-6")}>
                            {studioDataLoading && currentUser?.globalRole !== 'superAdmin' && pathname !== '/select-studio' ? <div className="flex h-full w-full items-center justify-center"><p>Cargando datos del estudio...</p></div> : children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}

export default function AppLayout({ children }: PropsWithChildren) {
    return (
        <AuthProvider>
            <StudioProvider>
                <StudioDataProvider>
                    <AppLayoutContent>{children}</AppLayoutContent>
                </StudioDataProvider>
            </StudioProvider>
        </AuthProvider>
    );
}

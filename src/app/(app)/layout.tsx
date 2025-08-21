
'use client';

import {
    CircleUser, LogOut, Landmark
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { ReactNode, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { DynamicMenu } from '@/components/dynamic-menu';
import { MAIN_MENU, CUSTOMER_MENU } from '@/lib/menu-config';

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

    // Determine which menu to use based on user role
    const menuItems = useMemo(() => {
        if (!profile) return [];
        
        // Customer portal gets different menu
        if (profile.globalRole === 'customer') {
            return CUSTOMER_MENU;
        }
        
        // All other roles get main menu (filtered by permissions)
        return MAIN_MENU;
    }, [profile]);

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
                        <DynamicMenu items={menuItems}>
                            {(visibleItems) => (
                                <SidebarMenu>
                                    {visibleItems.map((item) => {
                                        // Handle dividers
                                        if (item.divider) {
                                            return <div key={item.id} className="border-t border-sidebar-border my-2" />;
                                        }
                                        
                                        // Handle sections with children
                                        if (item.children) {
                                            return (
                                                <div key={item.id} className="mt-4">
                                                    {item.label && (
                                                        <div className="px-3 py-2 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                                                            {item.label}
                                                        </div>
                                                    )}
                                                    {item.children.map((child) => (
                                                        <SidebarMenuItem key={child.id}>
                                                            <SidebarMenuButton 
                                                                href={child.href} 
                                                                label={child.label || ''} 
                                                                icon={child.icon} 
                                                                isActive={child.href ? pathname.startsWith(child.href) : false} 
                                                            />
                                                        </SidebarMenuItem>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        
                                        // Handle regular menu items
                                        return (
                                            <SidebarMenuItem key={item.id}>
                                                <SidebarMenuButton 
                                                    href={item.href} 
                                                    label={item.label || ''} 
                                                    icon={item.icon} 
                                                    isActive={item.href ? pathname.startsWith(item.href) : false} 
                                                />
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            )}
                        </DynamicMenu>
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

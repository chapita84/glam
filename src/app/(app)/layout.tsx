import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  Wand2,
  LogOut,
  CircleUser,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import type { PropsWithChildren } from 'react';

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.93 2.13a2.47 2.47 0 0 1 4.14 0l.47.8a9.49 9.49 0 0 0 5.16 5.16l.8.47a2.47 2.47 0 0 1 0 4.14l-.8.47a9.49 9.49 0 0 0-5.16 5.16l-.47.8a2.47 2.47 0 0 1-4.14 0l-.47-.8a9.49 9.49 0 0 0-5.16-5.16l-.8-.47a2.47 2.47 0 0 1 0-4.14l.8-.47a9.49 9.49 0 0 0 5.16-5.16z" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m4.93 19.07 1.41-1.41" />
        <path d="m17.66 6.34 1.41-1.41" />
      </svg>
    );
}

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/appointments", icon: Calendar, label: "Appointments" },
    { href: "/services", icon: Sparkles, label: "Services" },
    { href: "/staff", icon: Users, label: "Staff" },
    { href: "/budgets", icon: Wand2, label: "Budgets" },
]

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <SparkleIcon className="w-8 h-8 text-sidebar-primary" />
                <h1 className="text-xl font-semibold text-sidebar-primary tracking-wider group-data-[collapsible=icon]:hidden">
                    GlamDash
                </h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                        <SidebarMenuButton asChild tooltip={item.label}>
                            <a>
                                <item.icon />
                                <span>{item.label}</span>
                            </a>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
               <Link href="/login" passHref>
                <SidebarMenuButton asChild tooltip="Logout">
                    <a>
                        <LogOut />
                        <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                    </a>
                </SidebarMenuButton>
              </Link>
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

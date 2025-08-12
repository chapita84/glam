
'use client';

import React, { createContext, useContext, useState, forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Sidebar Context for managing state
interface SidebarContextProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isCollapsible: 'icon' | 'full' | false;
  side: 'left' | 'right';
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Sidebar Provider to wrap the component tree
const SidebarProvider = ({ children, collapsible: initialCollapsible = 'icon', side = 'left' }: { children: React.ReactNode, collapsible?: 'icon' | 'full' | false, side?: 'left' | 'right' }) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsible === 'icon');

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isCollapsible: initialCollapsible, side }}>
      <div className={cn('flex', {
          'flex-row-reverse': side === 'right',
      })}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

// Main Sidebar Component
const sidebarVariants = cva(
  "flex flex-col h-screen transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        sidebar: 'bg-sidebar text-sidebar-foreground',
      },
      isCollapsed: {
        true: 'w-16',
        false: 'w-64',
      },
    },
    defaultVariants: {
      variant: "default",
      isCollapsed: false,
    },
  }
);

interface SidebarProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof sidebarVariants> {
    collapsible?: 'icon' | 'full' | false;
    side?: 'left' | 'right';
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, side='left', variant, ...props }, ref) => {
    const { isCollapsed, isCollapsible } = useSidebar();
    return (
      <aside ref={ref} className={cn(
          sidebarVariants({ variant, isCollapsed }), 
          'group',
          className
        )}
        data-collapsible={isCollapsible ? (isCollapsed ? 'icon': 'full') : 'false'}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';


// Other Components (Header, Content, Footer, etc.)
const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border-b border-sidebar-foreground/10", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 overflow-y-auto", className)} {...props} />
));
SidebarContent.displayName = "SidebarContent";

const SidebarMenu = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("space-y-2 p-2", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = forwardRef<HTMLAnchorElement, { href: string; label: string; icon: React.ElementType; isActive?: boolean; className?: string }>(
    ({ href, label, icon: Icon, isActive, className }, ref) => {
        const { isCollapsed } = useSidebar();

        return (
            <Button
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full flex justify-start items-center gap-3', { 'justify-center px-2': isCollapsed }, className)}
            >
                <Link href={href} ref={ref}>
                    <Icon className="h-5 w-5" />
                    <span className={cn('truncate', { 'sr-only': isCollapsed, 'group-data-[collapsible=icon]:hidden': isCollapsed })}>
                        {label}
                    </span>
                </Link>
            </Button>
        );
    }
);
SidebarMenuButton.displayName = "SidebarMenuButton";


const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border-t border-sidebar-foreground/10", className)} {...props} />
));
SidebarFooter.displayName = "SidebarFooter";


const SidebarTrigger = forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(({ className, ...props }, ref) => {
    const { isCollapsed, setIsCollapsed, side } = useSidebar();
    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("rounded-full", className)}
            {...props}
        >
            {side === 'left' ? (isCollapsed ? <ChevronRight /> : <ChevronLeft />) : (isCollapsed ? <ChevronLeft /> : <ChevronRight />)}
        </Button>
    )
})
SidebarTrigger.displayName = "SidebarTrigger";


const SidebarInset = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { isCollapsed, isCollapsible, side } = useSidebar();
    
    return (
        <main className={cn('flex-1 transition-all duration-300 ease-in-out', {
            'md:ml-64': !isCollapsed && isCollapsible && side === 'left',
            'md:ml-16': isCollapsed && isCollapsible && side === 'left',
             'md:mr-64': !isCollapsed && isCollapsible && side === 'right',
            'md:mr-16': isCollapsed && isCollapsible && side === 'right',
        }, className)}>
            {children}
        </main>
    )
}


export {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset
};

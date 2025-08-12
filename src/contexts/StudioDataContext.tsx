
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type PropsWithChildren } from 'react';
import { useStudio } from './StudioContext';
import { getRoles, getStaff, getServices, getBookings, getBudgets, getStudioConfig } from '@/lib/firebase/firestore';
import type { StaffMember, Service, Booking, Budget, StudioConfig } from '@/lib/firebase/firestore';
import { useAuth } from '@/app/(app)/layout';
import { CurrentUser, Role } from '@/lib/types';

export { type CurrentUser };

interface StudioDataContextType {
    studioId: string | null;
    roles: Role[];
    staff: StaffMember[];
    services: Service[];
    bookings: Booking[];
    budgets: Budget[];
    config: StudioConfig | null;
    loading: boolean;
    currentUser: CurrentUser | null;
    refreshData: () => void;
}

const StudioDataContext = createContext<StudioDataContextType | undefined>(undefined);

export function StudioDataProvider({ children }: PropsWithChildren) {
    const { studio } = useStudio();
    const { currentUser: authCurrentUser } = useAuth(); // Use the currentUser from AuthContext

    const [studioId, setStudioId] = useState<string | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [config, setConfig] = useState<StudioConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(authCurrentUser);

    const refreshData = useCallback(async () => {
        if (!studio || !authCurrentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [rolesData, staffData, servicesData, bookingsData, budgetsData, configData] = await Promise.all([
                getRoles(studio.id),
                getStaff(studio.id),
                getServices(studio.id),
                getBookings(studio.id),
                getBudgets(studio.id),
                getStudioConfig(studio.id),
            ]);
            
            setRoles(rolesData as Role[]);
            setStaff(staffData);
            setServices(servicesData);
            setBookings(bookingsData);
            setBudgets(budgetsData);
            setConfig(configData);

            const staffMember = staffData.find(s => s.id === authCurrentUser.uid);
            const role = staffMember ? (rolesData as Role[]).find(r => r.id === staffMember.roleId) : null;
            setCurrentUser({ ...authCurrentUser, ...staffMember, role: role || null });

        } catch (error) {
            console.error("Failed to refresh studio data:", error);
        } finally {
            setLoading(false);
        }
    }, [studio, authCurrentUser]);

    useEffect(() => {
        if (studio) {
            setStudioId(studio.id);
            refreshData();
        } else {
            setLoading(false);
            setStudioId(null);
            setRoles([]);
            setStaff([]);
            setServices([]);
            setBookings([]);
            setBudgets([]);
            setConfig(null);
            setCurrentUser(authCurrentUser); 
        }
    }, [studio, authCurrentUser, refreshData]);

    return (
        <StudioDataContext.Provider value={{ studioId, roles, staff, services, bookings, budgets, config, loading, currentUser, refreshData }}>
            {children}
        </StudioDataContext.Provider>
    );
}

export function useStudioData() {
    const context = useContext(StudioDataContext);
    if (context === undefined) {
        throw new Error('useStudioData must be used within a StudioDataProvider');
    }
    return context;
}


'use client'

import { AppointmentsCalendar } from "@/components/appointments-calendar";
import { type Booking, type Service, type StaffMember } from "@/lib/firebase/firestore";

interface AppointmentsPageProps {
  staff: StaffMember[];
  services: Service[];
  bookings: Booking[];
  tenantId: string;
  refreshData: () => void;
  loading: boolean;
}

export default function AppointmentsPage({ staff, services, bookings, tenantId, refreshData, loading }: AppointmentsPageProps) {
    const handleBookingCreated = () => {
        if (refreshData) {
            refreshData(); 
        }
    };

    if (loading) {
        return <p>Cargando citas...</p>
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
            <AppointmentsCalendar 
                bookings={bookings || []} 
                staff={staff || []}
                services={services || []}
                tenantId={tenantId}
                onBookingCreated={handleBookingCreated}
            />
        </div>
    );
}

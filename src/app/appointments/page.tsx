

'use client'

import { AppointmentsCalendar } from "@/components/appointments-calendar";
import { type Booking, type Service, type StaffMember, type TenantConfig } from "@/lib/firebase/firestore";

interface AppointmentsPageProps {
  staff: StaffMember[];
  services: Service[];
  bookings: Booking[];
  config: TenantConfig | null;
  tenantId: string;
  refreshData: () => void;
  loading: boolean;
}

export default function AppointmentsPage(props: AppointmentsPageProps) {
    const handleBookingCreated = () => {
        if (props.refreshData) {
            props.refreshData(); 
        }
    };

    if (props.loading) {
        return <div className="flex h-full w-full items-center justify-center"><p>Cargando citas...</p></div>
    }

    return (
        <AppointmentsCalendar 
            bookings={props.bookings || []} 
            staff={props.staff || []}
            services={props.services || []}
            config={props.config}
            tenantId={props.tenantId}
            onBookingCreated={handleBookingCreated}
        />
    );
}

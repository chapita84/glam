
'use client'

import { AppointmentsCalendar } from "@/components/appointments-calendar";
import { getBookings, type Booking, type Service, type StaffMember } from "@/lib/firebase/firestore";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentsPageProps {
  staff: StaffMember[];
  services: Service[];
  tenantId: string;
  refreshData: () => void;
}

export default function AppointmentsPage({ staff, services, tenantId, refreshData }: AppointmentsPageProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchBookings = async () => {
        setLoading(true);
        const fetchedBookings = await getBookings(tenantId);
        setBookings(fetchedBookings);
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, [tenantId]);

    const handleBookingCreated = () => {
        fetchBookings(); // Refresca las reservas cuando se crea una nueva
        refreshData(); // Llama a la función global de refresco si es necesario
    };


    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                       <Skeleton className="h-[370px] w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                </div>
            ) : (
                <AppointmentsCalendar 
                    bookings={bookings} 
                    staff={staff}
                    services={services}
                    tenantId={tenantId}
                    onBookingCreated={handleBookingCreated}
                />
            )}
        </div>
    );
}

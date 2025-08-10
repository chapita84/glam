
'use client'

import { AppointmentsCalendar } from "@/components/appointments-calendar";
import { getBookings, type Booking } from "@/lib/firebase/firestore";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppointmentsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Using a mock tenantId for now
    const tenantId = "test-tenant";

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            const fetchedBookings = await getBookings(tenantId);
            setBookings(fetchedBookings);
            setLoading(false);
        };
        fetchBookings();
    }, []);


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
                <AppointmentsCalendar bookings={bookings} />
            )}
        </div>
    );
}

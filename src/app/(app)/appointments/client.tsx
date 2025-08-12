
'use client'

import { AppointmentsCalendar } from "@/components/appointments-calendar";
import { useStudioData } from "@/contexts/StudioDataContext";
import { Loader2 } from "lucide-react";

export default function AppointmentsPageClient() {
    const { loading } = useStudioData();

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Cargando calendario y citas...</p>
                </div>
            </div>
        )
    }

    return <AppointmentsCalendar />;
}

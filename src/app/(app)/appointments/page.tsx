import { AppointmentsCalendar } from "@/components/appointments-calendar";

export default function AppointmentsPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
            <AppointmentsCalendar />
        </div>
    );
}


"use client"

import React, { useState, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { format, isSameDay, setHours, setMinutes, getDay, parse, addMinutes, startOfDay, endOfDay, eachHourOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { type Booking, type StaffMember, type Service, addOrUpdateBooking, type TenantConfig } from "@/lib/firebase/firestore"
import { ScrollArea } from "./ui/scroll-area"

type AppointmentsCalendarProps = {
    bookings: Booking[];
    staff: StaffMember[];
    services: Service[];
    config: TenantConfig | null;
    tenantId: string;
    onBookingCreated: () => void;
}

const eventColors = [
    'bg-red-500/20 border-red-500/80 text-red-300',
    'bg-blue-500/20 border-blue-500/80 text-blue-300',
    'bg-green-500/20 border-green-500/80 text-green-300',
    'bg-purple-500/20 border-purple-500/80 text-purple-300',
    'bg-yellow-500/20 border-yellow-500/80 text-yellow-300',
];

export function AppointmentsCalendar({ bookings, staff, services, config, tenantId, onBookingCreated }: AppointmentsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: es });
    const end = endOfWeek(currentDate, { locale: es });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handleSaveBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const bookingDate = selectedDate || new Date();
    const time = formData.get('time') as string;
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = setMinutes(setHours(bookingDate, hours), minutes);

    const serviceId = formData.get('serviceId') as string;
    const selectedService = services.find(s => s.id === serviceId);

    const staffId = formData.get('staffId') as string;
    const selectedStaff = staff.find(s => s.id === staffId);

    if (!selectedService || !selectedStaff) {
        console.error("Servicio o personal no encontrado");
        return;
    }

    const newBooking: Omit<Booking, 'id' | 'createdAt' | 'endTime'> = {
        clientName: formData.get('clientName') as string,
        clientId: 'temp-client-id', // Placeholder
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        duration: selectedService.duration,
        startTime: startTime,
        status: 'confirmed',
        price: {
            amount: selectedService.price,
            currency: 'USD',
        },
        notes: formData.get('notes') as string,
    }

    await addOrUpdateBooking(tenantId, newBooking);
    
    setOpen(false);
    setSelectedTime(null);
    setSelectedDate(null);
    onBookingCreated();
  };

  const handleOpenDialog = (date: Date, time: string | null = null) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setOpen(true);
  }

  const NewBookingForm = () => {
    const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
    const selectedService = services.find(s => s.id === selectedServiceId);

    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
              setSelectedTime(null);
              setSelectedDate(null);
          }
      }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveBooking}>
            <DialogHeader>
              <DialogTitle>Crear Nueva Cita</DialogTitle>
              <DialogDescription>
                Completa los detalles para agendar una nueva cita.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clientName" className="text-right">Cliente</Label>
                  <Input id="clientName" name="clientName" placeholder="Nombre del Cliente" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serviceId" className="text-right">Servicio</Label>
                   <Select name="serviceId" onValueChange={setSelectedServiceId} required>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                          {services.map(service => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="staffId" className="text-right">Personal</Label>
                   <Select name="staffId" required>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecciona un miembro" />
                      </SelectTrigger>
                      <SelectContent>
                          {staff.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">Hora</Label>
                  <Input id="time" name="time" type="time" defaultValue={selectedTime ?? undefined} className="col-span-3" required />
              </div>
              {selectedService && (
                <div className="text-sm text-muted-foreground col-span-4 grid grid-cols-4 items-center gap-4">
                    <span className="text-right">Detalles:</span>
                    <div className="col-span-3">
                        <p>Duración: {selectedService.duration} min</p>
                        <p>Precio: ${selectedService.price.toFixed(2)}</p>
                    </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Cita</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  const DayColumn = ({ day }: { day: Date }) => {
    const dayOfWeek = getDay(day);
    const workingDay = config?.workingHours?.find(d => d.dayOfWeek === dayOfWeek && d.enabled);
    const dayStart = workingDay ? parse(workingDay.startTime, 'HH:mm', day) : startOfDay(day);
    const dayEnd = workingDay ? parse(workingDay.endTime, 'HH:mm', day) : endOfDay(day);

    const hours = eachHourOfInterval({ start: dayStart, end: dayEnd });
    const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;

    const appointmentsForDay = bookings.filter(b => isSameDay(b.startTime, day));

    return (
      <div className="flex-1 border-r last:border-r-0">
        <div className="text-center py-2 border-b">
          <p className="text-xs uppercase text-muted-foreground">{format(day, "eee", { locale: es })}</p>
          <p className={`text-2xl font-bold mt-1 ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{format(day, "d")}</p>
        </div>
        <div className="relative h-[calc(100vh-170px)]">
          {hours.map((hour, index) => (
            <div
              key={index}
              className="relative h-24 border-t"
              onClick={() => handleOpenDialog(day, format(hour, "HH:mm"))}
            />
          ))}
          {appointmentsForDay.map((app, index) => {
            const top = (app.startTime.getTime() - dayStart.getTime()) / 60000 / totalMinutes * 100;
            const height = app.duration / totalMinutes * 100;
            const colorClass = eventColors[index % eventColors.length];
            return (
              <div 
                key={app.id} 
                className={`absolute left-2 right-2 p-2 rounded-lg border ${colorClass}`}
                style={{ top: `${top}%`, height: `${height}%` }}
              >
                <p className="font-semibold text-xs">{app.serviceName}</p>
                <p className="text-xs opacity-80">{app.clientName}</p>
                <p className="text-xs opacity-60">con {app.staffName}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full">
        <aside className="w-64 border-r p-4 space-y-4">
             <div className="flex items-center gap-4">
                <PlusCircle className="w-8 h-8"/>
                <h2 className="text-2xl font-bold">Calendario</h2>
            </div>
            <Button onClick={() => setOpen(true)} className="w-full">
                <PlusCircle className="mr-2"/>
                Crear
            </Button>
            <Calendar
                locale={es}
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                className="rounded-md"
                classNames={{
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                    day_today: "bg-accent text-accent-foreground",
                }}
            />
        </aside>
        <main className="flex-1 flex flex-col">
            <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => subDays(prev, 7))}>
                            <ChevronLeft />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, 7))}>
                            <ChevronRight />
                        </Button>
                    </div>
                     <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy", { locale: es })}</h2>
                </div>
                <div>
                    {/* Placeholder for view selector, etc. */}
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-16 text-xs text-center text-muted-foreground pt-[72px]">
                    {eachHourOfInterval({ start: setHours(new Date(), 7), end: setHours(new Date(), 18) }).map(hour => (
                        <div key={hour.toISOString()} className="h-24 flex items-start justify-center pt-1">
                            <span>{format(hour, "p", { locale: es })}</span>
                        </div>
                    ))}
                </div>
                <ScrollArea className="flex-1">
                    <div className="flex">
                        {weekDays.map(day => (
                            <DayColumn key={day.toISOString()} day={day} />
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </main>
        {open && <NewBookingForm />}
    </div>
  )
}

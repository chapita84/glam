
"use client"

import React, { useState, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { format, isSameDay, setHours, setMinutes, getDay, parse, addMinutes, startOfDay, endOfDay, eachHourOfInterval } from "date-fns"
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

export function AppointmentsCalendar({ bookings, staff, services, config, tenantId, onBookingCreated }: AppointmentsCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const todaysAppointments = useMemo(() => {
    return date
        ? bookings
            .filter(booking => isSameDay(booking.startTime, date))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        : [];
    }, [date, bookings]);

  const handleSaveBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const selectedDate = date || new Date();
    const time = formData.get('time') as string;
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = setMinutes(setHours(selectedDate, hours), minutes);

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
    onBookingCreated();
  };

  const handleOpenDialog = (time: string | null = null) => {
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

  const DailyScheduleView = () => {
    const dayOfWeek = date ? getDay(date) : -1;
    const workingDay = config?.workingHours?.find(d => d.dayOfWeek === dayOfWeek && d.enabled);

    if (!date || !workingDay) {
      return (
        <div className="h-[600px] flex items-center justify-center text-muted-foreground">
          <p>El estudio está cerrado este día.</p>
        </div>
      );
    }
    
    const dayStart = parse(workingDay.startTime, 'HH:mm', date);
    const dayEnd = parse(workingDay.endTime, 'HH:mm', date);
    const hours = eachHourOfInterval({ start: dayStart, end: dayEnd });
    
    const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;

    return (
      <div className="relative">
        {hours.map((hour, index) => (
          <div key={index} className="relative flex h-24 border-t border-muted/50">
            <div className="w-16 text-xs text-right pr-2 pt-1 text-muted-foreground">
              {format(hour, 'p', { locale: es })}
            </div>
            <div className="flex-1 border-l border-muted/50" />
          </div>
        ))}

        {todaysAppointments.map(app => {
          const top = (app.startTime.getTime() - dayStart.getTime()) / 60000 / totalMinutes * 100;
          const height = app.duration / totalMinutes * 100;
          
          return (
            <div 
              key={app.id} 
              className="absolute left-16 right-0 p-2 rounded-lg bg-primary/20 border border-primary/50 text-primary-foreground"
              style={{ top: `${top}%`, height: `${height}%` }}
            >
              <p className="font-semibold text-xs text-primary">{app.serviceName}</p>
              <p className="text-xs text-primary/80">{app.clientName}</p>
              <p className="text-xs text-primary/60">con {app.staffName}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr,2fr]">
        <div className="lg:order-2">
             <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Agenda - {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}</span>
                         <Button variant="ghost" size="icon" onClick={() => handleOpenDialog()}>
                            <PlusCircle className="h-5 w-5"/>
                        </Button>
                    </CardTitle>
                    <CardDescription>Citas programadas para el día seleccionado.</CardDescription>
                </CardHeader>
                <ScrollArea className="h-[600px]">
                  <CardContent className="p-4">
                    <DailyScheduleView />
                  </CardContent>
                </ScrollArea>
            </Card>
            {open && <NewBookingForm />}
        </div>
        <div className="lg:order-1">
            <Card>
                <CardContent className="p-0">
                    <Calendar
                        locale={es}
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                        classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                            day_today: "bg-accent text-accent-foreground",
                        }}
                        modifiers={{
                            booked: bookings.map(b => b.startTime)
                        }}
                        modifiersClassNames={{
                            booked: 'relative'
                        }}
                        components={{
                            DayContent: (props) => {
                                const isBooked = bookings.some(b => isSameDay(b.startTime, props.date));
                                return (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {props.date.getDate()}
                                        {isBooked && <div className="absolute bottom-1 w-1.5 h-1.5 bg-primary rounded-full"></div>}
                                    </div>
                                )
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

    
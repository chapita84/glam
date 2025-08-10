
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
import { format, isSameDay, setHours, setMinutes, getDay, parse, addMinutes } from "date-fns"
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

  const todaysAppointments = date 
    ? bookings.filter(booking => isSameDay(booking.startTime, date)) 
    : [];
  
  todaysAppointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

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

  const AvailableSlots = () => {
    const timeSlotInterval = 30; // minutes
    
    const availableSlots = useMemo(() => {
        if (!date || !config?.workingHours) return [];
        
        const dayOfWeek = getDay(date);
        const workingDay = config.workingHours.find(d => d.dayOfWeek === dayOfWeek && d.enabled);

        if (!workingDay) return [];

        const slots = [];
        let currentTime = parse(workingDay.startTime, 'HH:mm', date);
        const endTime = parse(workingDay.endTime, 'HH:mm', date);
        
        while(currentTime < endTime) {
            const slotStartTime = new Date(currentTime);
            const slotEndTime = addMinutes(slotStartTime, timeSlotInterval);

            const isBooked = todaysAppointments.some(booking => {
                const bookingStartTime = booking.startTime;
                const bookingEndTime = addMinutes(bookingStartTime, booking.duration);
                return (slotStartTime < bookingEndTime && slotEndTime > bookingStartTime);
            });

            if (!isBooked) {
                slots.push(format(slotStartTime, 'HH:mm'));
            }

            currentTime = addMinutes(currentTime, timeSlotInterval);
        }

        return slots;

    }, [date, config?.workingHours, todaysAppointments]);


    if (!date) return null;

    const dayOfWeek = getDay(date);
    const isWorkingDay = config?.workingHours?.some(d => d.dayOfWeek === dayOfWeek && d.enabled);

    if (!isWorkingDay) {
         return (
            <div className="text-center text-muted-foreground py-10">
                <p>El estudio está cerrado este día.</p>
            </div>
        )
    }

    return (
      <div className="grid grid-cols-4 gap-2">
        {availableSlots.length > 0 ? (
          availableSlots.map(slot => (
            <Button key={slot} variant="outline" onClick={() => handleOpenDialog(slot)}>
              {slot}
            </Button>
          ))
        ) : (
          <div className="col-span-4 text-center text-muted-foreground py-10">
            <p>No hay horarios disponibles.</p>
          </div>
        )}
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
                    <CardDescription>Citas existentes y horarios disponibles.</CardDescription>
                </CardHeader>
                 <ScrollArea className="h-[600px]">
                <CardContent className="space-y-4 p-4">
                   <h3 className="font-semibold text-lg">Citas Programadas</h3>
                    {todaysAppointments.length > 0 ? (
                        todaysAppointments.map(app => (
                            <div key={app.id} className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50">
                                <Avatar className="h-10 w-10 border">
                                  <AvatarImage src={`https://placehold.co/40x40.png?text=${app.clientName.charAt(0)}`} alt="Avatar" data-ai-hint="foto de perfil" />
                                  <AvatarFallback>{app.clientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{app.serviceName}</p>
                                    <p className="text-sm text-muted-foreground">{app.clientName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">con {app.staffName}</p>
                                </div>
                                <div className="text-sm font-medium">{format(app.startTime, 'p', { locale: es })}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No hay citas programadas para este día.</p>
                        </div>
                    )}

                    <h3 className="font-semibold text-lg pt-4">Horarios Disponibles</h3>
                    <AvailableSlots />
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

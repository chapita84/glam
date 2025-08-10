
"use client"

import React, { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { format, isSameDay, setHours, setMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { type Booking, type StaffMember, type Service, addOrUpdateBooking } from "@/lib/firebase/firestore"

type AppointmentsCalendarProps = {
    bookings: Booking[];
    staff: StaffMember[];
    services: Service[];
    tenantId: string;
    onBookingCreated: () => void;
}

export function AppointmentsCalendar({ bookings, staff, services, tenantId, onBookingCreated }: AppointmentsCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [open, setOpen] = useState(false);
  
  const todaysAppointments = date 
    ? bookings.filter(booking => isSameDay(booking.startTime, date)) 
    : [];
  
  todaysAppointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const handleSaveBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const selectedDate = date || new Date();
    const time = formData.get('time') as string; // "HH:mm"
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
    onBookingCreated();
  };

  const NewBookingForm = () => {
    const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
    const selectedService = services.find(s => s.id === selectedServiceId);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
              <PlusCircle className="h-5 w-5"/>
          </Button>
        </DialogTrigger>
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
                  <Input id="time" name="time" type="time" className="col-span-3" required />
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardContent className="p-2">
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
                        modifiersStyles={{
                            booked: {
                                border: "2px solid hsl(var(--primary))",
                                borderRadius: '50%'
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Agenda</span>
                        <NewBookingForm />
                    </CardTitle>
                    <CardDescription>{date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

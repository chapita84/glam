
"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "./ui/button"
import { PlusCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { type Booking } from "@/lib/firebase/firestore"

type AppointmentsCalendarProps = {
    bookings: Booking[];
}

export function AppointmentsCalendar({ bookings }: AppointmentsCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  
  const todaysAppointments = date 
    ? bookings.filter(booking => isSameDay(booking.startTime, date)) 
    : [];
  
  todaysAppointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

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
                        <Button variant="ghost" size="icon">
                            <PlusCircle className="h-5 w-5"/>
                        </Button>
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

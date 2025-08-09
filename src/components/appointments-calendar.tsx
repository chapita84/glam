"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "./ui/button"
import { PlusCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { format } from "date-fns"

const mockAppointments = {
  "2024-07-29": [
    { id: 1, name: "Olivia Martin", service: "Bridal Makeup", time: "2:00 PM", staff: "Jessica" },
    { id: 2, name: "Jackson Lee", service: "Hair Styling", time: "3:00 PM", staff: "Monica" },
  ],
  "2024-07-30": [
    { id: 3, name: "Isabella Nguyen", service: "Manicure & Pedicure", time: "10:00 AM", staff: "Sophie" },
    { id: 4, name: "William Kim", service: "Men's Haircut", time: "11:30 AM", staff: "Monica" },
    { id: 5, name: "Sofia Davis", service: "Luxury Facial", time: "1:00 PM", staff: "Jessica" },
  ],
  "2024-08-01": [
    { id: 6, name: "Ava Wilson", service: "Full-body Waxing", time: "4:00 PM", staff: "Sophie" },
  ]
}

type Appointment = {
    id: number;
    name: string;
    service: string;
    time: string;
    staff: string;
}

export function AppointmentsCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  
  const selectedDate = date ? format(date, "yyyy-MM-dd") : ""
  const todaysAppointments: Appointment[] = mockAppointments[selectedDate as keyof typeof mockAppointments] || []

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardContent className="p-2">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                        classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                            day_today: "bg-accent text-accent-foreground",
                        }}
                    />
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Schedule</span>
                        <Button variant="ghost" size="icon">
                            <PlusCircle className="h-5 w-5"/>
                        </Button>
                    </CardTitle>
                    <CardDescription>{date ? format(date, "PPP") : "Select a date"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {todaysAppointments.length > 0 ? (
                        todaysAppointments.map(app => (
                            <div key={app.id} className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50">
                                <Avatar className="h-10 w-10 border">
                                  <AvatarImage src={`https://placehold.co/40x40.png?text=${app.name.charAt(0)}`} alt="Avatar" data-ai-hint="profile picture" />
                                  <AvatarFallback>{app.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{app.service}</p>
                                    <p className="text-sm text-muted-foreground">{app.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">with {app.staff}</p>
                                </div>
                                <div className="text-sm font-medium">{app.time}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No appointments scheduled for this day.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

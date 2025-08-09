'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Clock, DollarSign, Star, Users, ArrowUp } from "lucide-react"

const chartData = [
  { month: "Enero", revenue: 1860 },
  { month: "Febrero", revenue: 3050 },
  { month: "Marzo", revenue: 2370 },
  { month: "Abril", revenue: 730 },
  { month: "Mayo", revenue: 2090 },
  { month: "Junio", revenue: 2140 },
]

const chartConfig = {
  revenue: {
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
}

const upcomingAppointments = [
  { name: "Olivia Martin", email: "olivia.martin@email.com", service: "Maquillaje de Novia", time: "2:00 PM" },
  { name: "Jackson Lee", email: "isabella.nguyen@email.com", service: "Peluquería", time: "3:00 PM" },
  { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", service: "Manicura", time: "4:00 PM" },
  { name: "William Kim", email: "will@email.com", service: "Pedicura", time: "5:00 PM" },
  { name: "Sofia Davis", email: "sofia.davis@email.com", service: "Facial", time: "6:00 PM" },
]

const recentReviews = [
    { name: "Evelyn Reed", rating: 5, review: "¡Absolutamente increíble! El mejor corte de pelo que he tenido. Muy profesional y amable." },
    { name: "Liam Quinn", rating: 5, review: "El ambiente es muy relajante, y mis uñas nunca se han visto mejor. ¡Lo recomiendo mucho!"},
    { name: "Chloe Vance", rating: 4, review: "Gran servicio, muy contenta con mi facial. El lugar es limpio y hermoso." },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Panel</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$45,231.89</div>
                    <p className="text-xs text-muted-foreground">+20.1% del último mes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Citas</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+2350</div>
                    <p className="text-xs text-muted-foreground">+180.1% del último mes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Calificación Prom.</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">4.9</div>
                    <p className="text-xs text-muted-foreground">Basado en 500 reseñas</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nuevas Reservas</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-muted-foreground">+201 desde la última hora</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Próximas Citas</CardTitle>
                    <CardDescription>
                        Tienes {upcomingAppointments.length} citas hoy.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {upcomingAppointments.slice(0, 5).map((appointment, index) => (
                          <div className="flex items-center" key={index}>
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={`https://placehold.co/32x32.png?text=${appointment.name.charAt(0)}`} alt="Avatar" data-ai-hint="foto de perfil" />
                              <AvatarFallback>{appointment.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                              <p className="text-sm font-medium leading-none">{appointment.name}</p>
                              <p className="text-sm text-muted-foreground">{appointment.service}</p>
                            </div>
                            <div className="ml-auto font-medium">{appointment.time}</div>
                          </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Reseñas Recientes</CardTitle>
                <CardDescription>
                    Aquí están las últimas reseñas de tus clientes.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {recentReviews.map((review, index) => (
                    <div key={index} className="flex gap-4">
                         <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${review.name.charAt(0)}`} alt="Avatar" data-ai-hint="foto de perfil" />
                            <AvatarFallback>{review.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{review.name}</p>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}/>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{review.review}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
  )
}

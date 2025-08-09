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
  { month: "January", revenue: 1860 },
  { month: "February", revenue: 3050 },
  { month: "March", revenue: 2370 },
  { month: "April", revenue: 730 },
  { month: "May", revenue: 2090 },
  { month: "June", revenue: 2140 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
}

const upcomingAppointments = [
  { name: "Olivia Martin", email: "olivia.martin@email.com", service: "Bridal Makeup", time: "2:00 PM" },
  { name: "Jackson Lee", email: "isabella.nguyen@email.com", service: "Hair Styling", time: "3:00 PM" },
  { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", service: "Manicure", time: "4:00 PM" },
  { name: "William Kim", email: "will@email.com", service: "Pedicure", time: "5:00 PM" },
  { name: "Sofia Davis", email: "sofia.davis@email.com", service: "Facial", time: "6:00 PM" },
]

const recentReviews = [
    { name: "Evelyn Reed", rating: 5, review: "Absolutely amazing! Best haircut I've ever had. So professional and friendly." },
    { name: "Liam Quinn", rating: 5, review: "The atmosphere is so relaxing, and my nails have never looked better. Highly recommend!"},
    { name: "Chloe Vance", rating: 4, review: "Great service, very happy with my facial. The place is clean and beautiful." },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$45,231.89</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+2350</div>
                    <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">4.9</div>
                    <p className="text-xs text-muted-foreground">Based on 500 reviews</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Bookings</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
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
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>
                        You have {upcomingAppointments.length} appointments today.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {upcomingAppointments.slice(0, 5).map((appointment, index) => (
                          <div className="flex items-center" key={index}>
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={`https://placehold.co/32x32.png?text=${appointment.name.charAt(0)}`} alt="Avatar" data-ai-hint="profile picture" />
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
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>
                    Here are the latest reviews from your clients.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {recentReviews.map((review, index) => (
                    <div key={index} className="flex gap-4">
                         <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${review.name.charAt(0)}`} alt="Avatar" data-ai-hint="profile picture" />
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

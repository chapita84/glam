
'use client'

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, MapPin, Phone, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAllStudios, Studio, getStaff, getServices, getBookings, StaffMember, Service, Booking } from "@/lib/firebase/firestore";

export default function StudioProfilePage({ params: { slug } }: { params: { slug: string } }) {
    const [studio, setStudio] = useState<Studio | null>(null);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudioData = async () => {
            setLoading(true);
            const studios = await getAllStudios();
            const currentStudio = studios.find(s => s.id === slug); // Simple slug-matching for now
            
            if (currentStudio) {
                setStudio(currentStudio);
                const [staffData, servicesData, bookingsData] = await Promise.all([
                    getStaff(currentStudio.id),
                    getServices(currentStudio.id),
                    getBookings(currentStudio.id)
                ]);
                setStaff(staffData);
                setServices(servicesData);
                setBookings(bookingsData);
            }
            setLoading(false);
        };

        fetchStudioData();
    }, [slug]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (!studio) {
        return <div className="flex h-screen items-center justify-center"><p>Estudio no encontrado.</p></div>;
    }

    return (
        <div className="container mx-auto py-6 px-4 md:px-6">
            <header className="mb-6">
                <div className="h-64 md:h-96 rounded-lg overflow-hidden relative">
                    <Image src={studio.logoUrl || "https://placehold.co/1200x600.png"} alt={`Foto de ${studio.name}`} layout="fill" objectFit="cover" />
                </div>
                <div className="mt-[-60px] px-6">
                    <Card className="p-6 shadow-xl max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold">{studio.name}</h1>
                                <p className="text-muted-foreground mt-1">{studio.location}</p>
                                {/* Rating and reviews are static for now */}
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                                    <span className="font-bold">4.8</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">(152 reseñas)</span>
                                </div>
                            </div>
                             <Button size="lg" className="w-full md:w-auto" asChild>
                                <Link href="/appointments">Reservar Turno</Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </header>

            <main>
                 <Tabs defaultValue="services" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                        <TabsTrigger value="services">Servicios</TabsTrigger>
                        <TabsTrigger value="staff">Staff</TabsTrigger>
                        <TabsTrigger value="reviews">Reseñas</TabsTrigger>
                        <TabsTrigger value="info">Información</TabsTrigger>
                    </TabsList>
                    <TabsContent value="services">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {services.map((service) => (
                                <Card key={service.name}>
                                    <CardHeader>
                                        <CardTitle className="text-xl">{service.name}</CardTitle>
                                        <div className="flex items-center justify-between text-muted-foreground text-sm">
                                            <span>{service.duration} min</span>
                                            <span className="font-bold text-lg text-foreground">${service.price}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{service.category}</p>
                                        <Button className="w-full mt-4" asChild>
                                            <Link href="/appointments">Añadir a la Reserva</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="staff">
                         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {staff.map(member => (
                                <Card key={member.name} className="text-center">
                                    <CardContent className="p-6">
                                        <Avatar className="h-24 w-24 mx-auto mb-4">
                                            <AvatarImage src={member.avatar || `https://placehold.co/96x96.png`} />
                                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-semibold text-lg">{member.name}</h3>
                                        <p className="text-muted-foreground">{member.roleId}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="reviews">
                       <div className="space-y-6 max-w-3xl mx-auto">
                           {/* Reviews are static for now */}
                           <p className="text-center text-muted-foreground">Las reseñas estarán disponibles próximamente.</p>
                       </div>
                    </TabsContent>
                    <TabsContent value="info">
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Sobre Nosotros</h3>
                                <p className="text-muted-foreground">{studio.description}</p>
                                 <h3 className="text-xl font-semibold mt-6 mb-4">Contacto</h3>
                                 <div className="flex items-center gap-3 text-muted-foreground">
                                     <Phone className="h-4 w-4" />
                                     <span>{studio.phone}</span>
                                 </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Ubicación</h3>
                                <div className="aspect-video rounded-lg overflow-hidden relative">
                                    <Image src="https://placehold.co/600x400.png" layout="fill" objectFit="cover" alt="Mapa de ubicación" />
                                </div>
                                 <div className="flex items-center gap-3 mt-4 text-muted-foreground">
                                     <MapPin className="h-4 w-4" />
                                     <span>{studio.location}</span>
                                 </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

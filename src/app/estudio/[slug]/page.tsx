
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const mockStudioData = {
    name: "Estudio Belleza Total",
    slug: "estudio-belleza-total",
    location: "Recoleta, Buenos Aires",
    rating: 4.8,
    reviewCount: 152,
    priceTier: 3,
    images: [
        "https://placehold.co/1200x600.png",
        "https://placehold.co/1200x600.png",
        "https://placehold.co/1200x600.png",
    ],
    description: "En Estudio Belleza Total, nos dedicamos a realzar tu belleza natural con servicios de la más alta calidad en un ambiente relajante y profesional. Nuestro equipo de expertos está listo para ofrecerte una experiencia inolvidable.",
    hours: [
        { day: "Lunes - Viernes", time: "9:00 AM - 8:00 PM" },
        { day: "Sábado", time: "10:00 AM - 6:00 PM" },
        { day: "Domingo", time: "Cerrado" },
    ],
    phone: "+54 11 1234 5678",
    services: [
        { name: "Manicura Clásica", description: "Un tratamiento completo para tus manos.", duration: "30 min", price: "$25.00" },
        { name: "Pedicura Spa", description: "Relajación y belleza para tus pies.", duration: "45 min", price: "$40.00" },
        { name: "Facial Hidratante", description: "Renueva e hidrata tu piel en profundidad.", duration: "60 min", price: "$75.00" },
        { name: "Corte y Peinado", description: "Un nuevo look por nuestros mejores estilistas.", duration: "60 min", price: "$60.00" },
        { name: "Maquillaje Social", description: "Luce espectacular en tu próximo evento.", duration: "50 min", price: "$50.00" },
    ],
    staff: [
        { name: "Jessica Miller", role: "Estilista Principal", avatar: "JM" },
        { name: "Monica Evans", role: "Estilista", avatar: "ME" },
        { name: "Sophie Chen", role: "Artista de Uñas", avatar: "SC" },
    ],
    reviews: [
        { name: "Ana Pérez", rating: 5, comment: "¡Servicio increíble! El mejor facial que he recibido. Súper profesionales y amables.", date: "hace 2 días" },
        { name: "Carlos Gómez", rating: 5, comment: "Mi manicura quedó perfecta. El lugar es muy limpio y el ambiente es muy relajante.", date: "hace 1 semana" },
        { name: "Laura Sánchez", rating: 4, comment: "Muy buen corte de pelo, aunque tuve que esperar un poco. Volvería.", date: "hace 3 semanas" },
    ]
};


export default function StudioProfilePage({ params: { slug } }: { params: { slug: string } }) {
    // En un futuro, aquí se haría un fetch a la base de datos usando el slug
    const studio = mockStudioData;

    return (
        <div className="container mx-auto py-6 px-4 md:px-6">
            <header className="mb-6">
                <div className="h-64 md:h-96 rounded-lg overflow-hidden relative">
                    <Image src={studio.images[0]} alt={`Foto de ${studio.name}`} layout="fill" objectFit="cover" data-ai-hint="foto del local" />
                </div>
                <div className="mt-[-60px] px-6">
                    <Card className="p-6 shadow-xl max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold">{studio.name}</h1>
                                <p className="text-muted-foreground mt-1">{studio.location}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                                    <span className="font-bold">{studio.rating}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">({studio.reviewCount} reseñas)</span>
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
                            {studio.services.map((service) => (
                                <Card key={service.name}>
                                    <CardHeader>
                                        <CardTitle className="text-xl">{service.name}</CardTitle>
                                        <div className="flex items-center justify-between text-muted-foreground text-sm">
                                            <span>{service.duration}</span>
                                            <span className="font-bold text-lg text-foreground">{service.price}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{service.description}</p>
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
                            {studio.staff.map(member => (
                                <Card key={member.name} className="text-center">
                                    <CardContent className="p-6">
                                        <Avatar className="h-24 w-24 mx-auto mb-4">
                                            <AvatarImage src={`https://placehold.co/96x96.png?text=${member.avatar}`} data-ai-hint="foto de perfil" />
                                            <AvatarFallback>{member.avatar}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-semibold text-lg">{member.name}</h3>
                                        <p className="text-muted-foreground">{member.role}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="reviews">
                       <div className="space-y-6 max-w-3xl mx-auto">
                            {studio.reviews.map((review, index) => (
                                <Card key={index}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={`https://placehold.co/48x48.png?text=${review.name.charAt(0)}`} data-ai-hint="foto de perfil"/>
                                                <AvatarFallback>{review.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold">{review.name}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}/>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{review.date}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                       </div>
                    </TabsContent>
                    <TabsContent value="info">
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Sobre Nosotros</h3>
                                <p className="text-muted-foreground">{studio.description}</p>
                                
                                <h3 className="text-xl font-semibold mt-6 mb-4">Horarios</h3>
                                <ul className="space-y-2 text-muted-foreground">
                                    {studio.hours.map(h => (
                                        <li key={h.day} className="flex justify-between">
                                            <span>{h.day}</span>
                                            <span>{h.time}</span>
                                        </li>
                                    ))}
                                </ul>
                                 <h3 className="text-xl font-semibold mt-6 mb-4">Contacto</h3>
                                 <div className="flex items-center gap-3 text-muted-foreground">
                                     <Phone className="h-4 w-4" />
                                     <span>{studio.phone}</span>
                                 </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Ubicación</h3>
                                <div className="aspect-video rounded-lg overflow-hidden relative">
                                    <Image src="https://placehold.co/600x400.png" layout="fill" objectFit="cover" alt="Mapa de ubicación" data-ai-hint="mapa" />
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

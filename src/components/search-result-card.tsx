
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import Image from "next/image"
import { Button } from "./ui/button"
import Link from "next/link"

type SearchResultCardProps = {
    name: string;
    location: string;
    rating: number;
    reviewCount: number;
    services: string[];
    imageUrl: string;
    categories: string[];
    priceTier: number;
    slug: string; // Añadido para el enlace
}

export function SearchResultCard({ name, location, rating, reviewCount, services, imageUrl, slug }: SearchResultCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-3">
        <div className="md:col-span-1">
          <Image src={imageUrl} alt={name} width={600} height={400} className="h-full w-full object-cover" data-ai-hint="foto del local" />
        </div>
        <div className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col h-full">
                <h2 className="text-2xl font-bold">{name}</h2>
                <p className="text-muted-foreground mt-1">{location}</p>
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center">
                       <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                       <span className="font-bold">{rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({reviewCount} reseñas)</span>
                </div>
                <div className="my-4">
                    <div className="flex flex-wrap gap-2">
                        {services.map(service => (
                            <Badge key={service} variant="secondary">{service}</Badge>
                        ))}
                    </div>
                </div>
                <div className="mt-auto flex justify-end">
                     <Button asChild>
                        <Link href={`/estudio/${slug}`}>Ver Perfil y Reservar</Link>
                     </Button>
                </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  )
}

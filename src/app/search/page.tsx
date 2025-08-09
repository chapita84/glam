
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { List, Map, Search, Star } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { SearchResultCard } from "@/components/search-result-card"


const mockResults = [
    {
        name: "Estudio Belleza Total",
        location: "Recoleta, Buenos Aires",
        rating: 4.8,
        reviewCount: 152,
        services: ["Manicura", "Pedicura", "Facial"],
        imageUrl: "https://placehold.co/600x400.png"
    },
    {
        name: "Glamour Nails & Spa",
        location: "Palermo, Buenos Aires",
        rating: 4.9,
        reviewCount: 210,
        services: ["Uñas Esculpidas", "Spa de Manos", "Pestañas"],
        imageUrl: "https://placehold.co/600x400.png"
    },
    {
        name: "Corte & Estilo Urbano",
        location: "San Telmo, Buenos Aires",
        rating: 4.7,
        reviewCount: 88,
        services: ["Corte de Pelo", "Barbería", "Coloración"],
        imageUrl: "https://placehold.co/600x400.png"
    },
     {
        name: "Oasis de Relajación",
        location: "Belgrano, Buenos Aires",
        rating: 5.0,
        reviewCount: 305,
        services: ["Masajes", "Tratamientos Corporales", "Sauna"],
        imageUrl: "https://placehold.co/600x400.png"
    },
]


export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
            <h1 className="text-2xl font-bold tracking-wider mr-6">Glam&Beauty</h1>
            <div className="relative w-full max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Buscar por estudio o servicio..." className="pl-10" />
            </div>
            <div className="ml-auto">
                <Button>Iniciar Sesión</Button>
            </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <Card>
                <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-4">Filtros</h2>
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="location">Ubicación</Label>
                            <Input id="location" placeholder="ej. Palermo, Buenos Aires" />
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Categorías</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="cat-hair" />
                                    <Label htmlFor="cat-hair" className="font-normal">Peluquería</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="cat-nails" />
                                    <Label htmlFor="cat-nails" className="font-normal">Uñas</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="cat-skin" />
                                    <Label htmlFor="cat-skin" className="font-normal">Cuidado de la Piel</Label>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <Checkbox id="cat-wellness" />
                                    <Label htmlFor="cat-wellness" className="font-normal">Bienestar</Label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Rango de Precios</h3>
                            <Slider defaultValue={[50]} max={200} step={10} />
                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                <span>$0</span>
                                <span>$200+</span>
                            </div>
                        </div>

                         <div>
                            <h3 className="font-medium mb-2">Valoración</h3>
                             <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400 cursor-pointer" />
                                ))}
                            </div>
                        </div>
                        
                         <Button className="w-full">Aplicar Filtros</Button>
                    </div>
                </CardContent>
            </Card>
          </aside>
          
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground">Mostrando {mockResults.length} resultados</p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="bg-primary text-primary-foreground"><List className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon"><Map className="h-4 w-4"/></Button>
                </div>
            </div>
            <div className="grid gap-6">
                {mockResults.map((result, index) => (
                    <SearchResultCard key={index} {...result} />
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

type Service = {
  id: number;
  name: string;
  category: string;
  duration: string;
  price: string;
}

const initialServices: Service[] = [
  { id: 1, name: "Maquillaje de Novia", category: "Maquillaje", duration: "120 min", price: "$250.00" },
  { id: 2, name: "Peluquería", category: "Cabello", duration: "60 min", price: "$80.00" },
  { id: 3, name: "Manicura de Lujo", category: "Uñas", duration: "45 min", price: "$50.00" },
  { id: 4, name: "Pedicura de Lujo", category: "Uñas", duration: "60 min", price: "$75.00" },
  { id: 5, name: "Masaje de Tejido Profundo", category: "Bienestar", duration: "90 min", price: "$150.00" },
  { id: 6, name: "Facial Insignia", category: "Cuidado de la piel", duration: "75 min", price: "$130.00" },
  { id: 7, name: "Depilación Corporal Completa", category: "Depilación", duration: "60 min", price: "$100.00" },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleSaveService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const serviceData = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        duration: formData.get('duration') as string,
        price: formData.get('price') as string,
    };

    if (editingService) {
        // Update existing service
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...serviceData } : s));
    } else {
        // Add new service
        const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
        setServices([...services, { id: newId, ...serviceData }]);
    }

    setOpen(false);
    setEditingService(null);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setOpen(true);
  };
  
  const handleOpenDialog = (service: Service | null) => {
    setEditingService(service);
    setOpen(true);
  }

  const handleDelete = (id: number) => {
    setServices(services.filter(s => s.id !== id));
  };


  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
            <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if(!isOpen) setEditingService(null); }}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Servicio
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSaveService}>
                        <DialogHeader>
                            <DialogTitle>{editingService ? "Editar Servicio" : "Añadir Nuevo Servicio"}</DialogTitle>
                            <DialogDescription>
                                {editingService ? "Actualiza los detalles del servicio." : "Completa los detalles del nuevo servicio que quieres ofrecer."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nombre</Label>
                                <Input id="name" name="name" defaultValue={editingService?.name} placeholder="p. ej. Maquillaje de Novia" className="col-span-3" required/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Categoría</Label>
                                <Input id="category" name="category" defaultValue={editingService?.category} placeholder="p. ej. Maquillaje" className="col-span-3" required/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="duration" className="text-right">Duración</Label>
                                <Input id="duration" name="duration" defaultValue={editingService?.duration} placeholder="p. ej. 120 min" className="col-span-3" required/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">Precio</Label>
                                <Input id="price" name="price" defaultValue={editingService?.price} placeholder="p. ej. $250.00" className="col-span-3" required/>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Guardar servicio</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
          <CardDescription>
            Gestiona tus servicios y sus detalles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.category}</Badge>
                  </TableCell>
                  <TableCell>{service.duration}</TableCell>
                  <TableCell>{service.price}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(service)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(service.id)}>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

    
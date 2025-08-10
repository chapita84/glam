
'use client'

import React, { useState } from "react"
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
import { addOrUpdateService, deleteService, type Service } from "@/lib/firebase/firestore"

interface ServicesPageProps {
  services: Service[];
  tenantId: string;
  refreshData: () => void;
  loading: boolean;
}

export default function ServicesPage({ services = [], tenantId, refreshData, loading }: ServicesPageProps) {
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleSaveService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const serviceData = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        duration: parseInt(formData.get('duration') as string, 10),
        price: parseFloat(formData.get('price') as string),
    };

    if (serviceData.name && serviceData.category && !isNaN(serviceData.duration) && !isNaN(serviceData.price)) {
        const id = editingService?.id || serviceData.name.toLowerCase().replace(/\s+/g, '_');
        await addOrUpdateService(tenantId, { id, ...serviceData });
        
        setOpen(false);
        setEditingService(null);
        await refreshData();
    }
  };
  
  const handleOpenDialog = (service: Service | null) => {
    setEditingService(service);
    setOpen(true);
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
        await deleteService(tenantId, id);
        await refreshData();
    }
  };

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><p>Cargando servicios...</p></div>
  }


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
                                <Input id="name" name="name" defaultValue={editingService?.name} placeholder="p. ej. Maquillaje de Novia" className="col-span-3" required disabled={!!editingService}/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Categoría</Label>
                                <Input id="category" name="category" defaultValue={editingService?.category} placeholder="p. ej. Maquillaje" className="col-span-3" required/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="duration" className="text-right">Duración (min)</Label>
                                <Input id="duration" name="duration" type="number" defaultValue={editingService?.duration} placeholder="p. ej. 120" className="col-span-3" required/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">Precio ($)</Label>
                                <Input id="price" name="price" type="number" step="0.01" defaultValue={editingService?.price} placeholder="p. ej. 250.00" className="col-span-3" required/>
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
                  <TableCell>{service.duration} min</TableCell>
                  <TableCell>${service.price.toFixed(2)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleOpenDialog(service)}>Editar</DropdownMenuItem>
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

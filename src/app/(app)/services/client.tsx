
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  addOrUpdateService,
  deleteService,
  getServicesForStudio,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { type Service } from '@/lib/types';

export default function ServicesPageClient() {
  const { currentStudio, profile, currentStudioRole } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const isSuperAdmin = profile?.globalRole === 'superAdmin';
  const canCreate = isSuperAdmin || (currentStudioRole?.permissions.includes('services:create') ?? false);
  const canUpdate = isSuperAdmin || (currentStudioRole?.permissions.includes('services:update') ?? false);
  const canDelete = isSuperAdmin || (currentStudioRole?.permissions.includes('services:delete') ?? false);

  const refreshData = async () => {
    if (!currentStudio) return;
    setLoading(true);
    const fetchedServices = await getServicesForStudio(currentStudio.id);
    setServices(fetchedServices);
    setLoading(false);
  };

  useEffect(() => {
    if (currentStudio) {
      refreshData();
    } else {
      setLoading(false);
    }
  }, [currentStudio]);

  const handleSaveService = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!currentStudio) {
      toast({
        title: 'Error',
        description: 'No hay un estudio seleccionado.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const serviceData: Omit<Service, 'id'> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      duration: parseInt(formData.get('duration') as string, 10),
      price: parseFloat(formData.get('price') as string),
    };

    try {
      if (serviceData.name && serviceData.description && !isNaN(serviceData.duration) && !isNaN(serviceData.price)) {
        await addOrUpdateService(currentStudio.id, {
          ...serviceData,
          id: editingService?.id,
        });
        setOpen(false);
        setEditingService(null);
        await refreshData();
        toast({
          title: '¡Éxito!',
          description: 'El servicio se ha guardado correctamente.',
        });
      } else {
        throw new Error('Por favor, completa todos los campos correctamente.');
      }
    } catch (error: any) {
      toast({
        title: 'Error al guardar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDialog = (service: Service | null) => {
    setEditingService(service);
    setOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!currentStudio) {
      toast({
        title: 'Error',
        description: 'No hay un estudio seleccionado.',
        variant: 'destructive',
      });
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      try {
        await deleteService(currentStudio.id, serviceId);
        await refreshData();
        toast({
          title: 'Servicio Eliminado',
          description: 'El servicio se ha eliminado de tu lista.',
        });
      } catch (e) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el servicio.',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!currentStudio) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-muted-foreground">
          {profile?.globalRole === 'superAdmin'
            ? 'Selecciona un estudio para empezar a gestionarlo.'
            : 'No tienes un estudio asignado. Contacta al administrador.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
        {canCreate && (
            <Button onClick={() => handleOpenDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Servicio
            </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
          <CardDescription>
            Gestiona los servicios ofrecidos en {currentStudio.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.description}</TableCell>
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
                          {canUpdate && <DropdownMenuItem onClick={() => handleOpenDialog(service)}>Editar</DropdownMenuItem>}
                          {canDelete && <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(service.id!)}>Eliminar</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No hay servicios creados en este estudio.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setEditingService(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveService}>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? 'Actualiza los detalles del servicio.'
                  : 'Completa los detalles del nuevo servicio.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nombre</Label>
                    <Input id="name" name="name" defaultValue={editingService?.name} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Descripción</Label>
                    <Input id="description" name="description" defaultValue={editingService?.description} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">Duración (min)</Label>
                    <Input id="duration" name="duration" type="number" defaultValue={editingService?.duration} className="col-span-3" required/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Precio ($)</Label>
                    <Input id="price" name="price" type="number" step="0.01" defaultValue={editingService?.price} className="col-span-3" required/>
                </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar servicio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

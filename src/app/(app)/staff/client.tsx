
'use client';

import React, { useState, useEffect } from 'react';
import {
  getStaffForStudio,
  // deleteStaffMember has been removed as it requires a backend implementation
} from '@/lib/firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Badge } from '@/components/ui/badge';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { app, db } from '@/lib/firebase/config';
import { type UserProfile, type StudioRole } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';

const functions = getFunctions(app, 'us-central1');
const createStaffUserFn = httpsCallable(functions, 'createStaffUser');

type StaffMemberWithRole = UserProfile & { roleId: string };

export default function StaffPageClient() {
  const { currentStudio, profile, currentUser, currentStudioRole } = useAuth();
  const [staff, setStaff] = useState<StaffMemberWithRole[]>([]);
  const [studioRoles, setStudioRoles] = useState<StudioRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Verificar permisos
  const isSuperAdmin = profile?.globalRole === 'superAdmin';
  const canCreateStaff = isSuperAdmin || currentStudioRole?.permissions.includes('staff:create') || false;
  const canUpdateStaff = isSuperAdmin || currentStudioRole?.permissions.includes('staff:update') || false;
  const canDeleteStaff = isSuperAdmin || currentStudioRole?.permissions.includes('staff:delete') || false;

  const refreshData = async () => {
    if (!currentStudio) return;
    setLoading(true);
    try {
      const [fetchedStaff, rolesSnapshot] = await Promise.all([
        getStaffForStudio(currentStudio.id),
        getDocs(collection(db, 'studios', currentStudio.id, 'roles')),
      ]);
      setStaff(fetchedStaff);
      setStudioRoles(
        rolesSnapshot.docs.map((doc) => doc.data() as StudioRole)
      );
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del personal.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentStudio) {
      refreshData();
    } else {
      setLoading(false);
    }
  }, [currentStudio]);

  const handleCreateStaff = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!currentStudio) {
      toast({
        title: 'Error',
        description: 'No se ha podido identificar el estudio.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const displayName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const roleId = formData.get('roleId') as string;

    try {
      await createStaffUserFn({
        studioId: currentStudio.id,
        email,
        password,
        displayName,
        roleId,
        globalRole: 'staff',
      });
      
      setIsDialogOpen(false);
      
      // Esperar un poco antes de refrescar para asegurar que los datos estén actualizados
      setTimeout(async () => {
        await refreshData();
      }, 1000);
      
      toast({
        title: '¡Éxito!',
        description: 'El nuevo miembro del personal ha sido creado y añadido.',
      });
    } catch (error: any) {
      toast({
        title: 'Error al crear',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (member: StaffMemberWithRole) => {
     if (!currentStudio) {
      toast({ title: "Error", description: "No se ha podido identificar el estudio.", variant: "destructive"});
      return;
    }
    if (confirm(`¿Estás seguro de que quieres eliminar a ${member.displayName}?`)) {
        console.log("Deletion logic needs a backend Cloud Function for Auth deletion.");
        toast({ title: "Funcionalidad no implementada", description: "La eliminación de usuarios debe realizarse desde un entorno seguro." });
    }
  };

  const getRoleName = (roleId: string) =>
    studioRoles.find((r) => r.id === roleId)?.name || 'Sin Rol';

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
        <h1 className="text-2xl font-bold">Gestión de Personal</h1>
        <p className="text-muted-foreground">
          Por favor, selecciona un estudio para ver su personal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
        {canCreateStaff && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Personal
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tu Equipo en {currentStudio.name}</CardTitle>
          <CardDescription>
            Gestiona los miembros de tu personal y sus roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.photoURL || `https://avatar.vercel.sh/${member.email}.png`} />
                        <AvatarFallback>{member.displayName?.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.displayName}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.roleId === 'owner' ? 'default' : 'secondary'}>
                      {getRoleName(member.roleId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(member)}
                      disabled={currentUser?.uid === member.uid}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateStaff}>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Personal</DialogTitle>
              <DialogDescription>
                Crea una nueva cuenta para un miembro de tu equipo y asígnale un
                rol.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input id="name" name="name" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Correo</Label>
                <Input id="email" name="email" type="email" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Contraseña</Label>
                <Input id="password" name="password" type="password" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roleId" className="text-right">Rol</Label>
                <Select name="roleId" required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {studioRoles
                      .filter((r) => r.id !== 'owner')
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Miembro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


'use client'

import React, { useState } from "react"
import type { Role } from "../layout"
import { addOrUpdateStaffMember, deleteStaffMember, type StaffMember } from "@/lib/firebase/firestore";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStudioData } from "@/contexts/StudioDataContext";
import { useToast } from "@/hooks/use-toast";

export default function StaffPageClient() {
  const { roles, staff, studioId, refreshData, loading } = useStudioData();
  const [open, setOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (member: StaffMember | null) => {
    setEditingMember(member);
    setOpen(true);
  };
  
  const handleSaveMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studioId) {
      toast({ title: "Error", description: "No se ha podido identificar el estudio.", variant: "destructive"});
      return;
    }

    setIsSaving(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const roleId = formData.get('roleId') as string;
    const name = formData.get('name') as string || email.split('@')[0];

    // In a real app, you would ideally use the UID from Firebase Auth as the ID
    const memberId = editingMember?.id || email;

    try {
        if (email && roleId && name) {
            await addOrUpdateStaffMember(studioId, { id: memberId, name, email, roleId });
            await refreshData();
            setOpen(false);
            setEditingMember(null);
            toast({ title: "¡Éxito!", description: "El miembro del personal se ha guardado correctamente." });
        } else {
            throw new Error("Por favor, completa todos los campos.");
        }
    } catch(error: any) {
        toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
      if (!studioId) {
        toast({ title: "Error", description: "No se ha podido identificar el estudio.", variant: "destructive"});
        return;
      }
      if (confirm('¿Estás seguro de que quieres eliminar a este miembro del equipo?')) {
          try {
            await deleteStaffMember(studioId, userId);
            await refreshData();
            toast({ title: "Miembro Eliminado" });
          } catch(e) {
            toast({ title: "Error", description: "No se pudo eliminar al miembro.", variant: "destructive" });
          }
      }
  }
  
  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || 'Sin Rol';
  }
  
  if (loading) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
                <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Añadir Personal</Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Tu Equipo</CardTitle>
                    <CardDescription>Gestiona los miembros de tu personal y sus roles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="ml-4 text-muted-foreground">Cargando personal...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
            <Button onClick={() => handleOpenDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Personal
            </Button>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Tu Equipo</CardTitle>
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
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => {
                  const avatarFallback = member.name.split(' ').map(n => n[0]).join('');
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar || `https://placehold.co/40x40.png?text=${avatarFallback}`} />
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.roleId === "super_admin" ? "destructive" : (member.roleId === "owner" ? "default" : "secondary")}>{getRoleName(member.roleId)}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" /><span className="sr-only">Menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenDialog(member)}>Editar Rol</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(member.id)}>Eliminar del Equipo</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setEditingMember(null); }}>
        <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveMember}>
                <DialogHeader>
                    <DialogTitle>{editingMember ? 'Editar Miembro' : 'Añadir Nuevo Miembro'}</DialogTitle>
                    <DialogDescription>
                        {editingMember ? 'Actualiza el rol de este miembro.' : 'Introduce los datos y asígnale un rol.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" name="name" defaultValue={editingMember?.name} placeholder="Nombre Apellido" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Correo</Label>
                        <Input id="email" name="email" type="email" defaultValue={editingMember?.email} placeholder="staff@example.com" className="col-span-3" required disabled={!!editingMember}/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="roleId" className="text-right">Rol</Label>
                        <Select name="roleId" defaultValue={editingMember?.roleId} required>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                            <SelectContent>
                                {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingMember ? 'Guardar Cambios' : 'Añadir Miembro'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    </div>
  )
}


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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StaffPageProps {
  roles: Role[];
  staff: StaffMember[];
  refreshData: () => void;
  loading: boolean;
  tenantId: string;
}

export default function StaffPage({ roles = [], staff = [], refreshData, loading, tenantId }: StaffPageProps) {
  const [open, setOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  const handleOpenDialog = (member: StaffMember | null) => {
    setEditingMember(member);
    setOpen(true);
  };
  
  const handleSaveMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const roleId = formData.get('roleId') as string;

    if (email && roleId) {
        // In a real app, userId would come from Firebase Auth after user creation/lookup
        const memberId = editingMember?.id || email; 
        const name = editingMember?.name || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());

        await addOrUpdateStaffMember(tenantId, { id: memberId, name, email, roleId });
        await refreshData();
        
        setOpen(false);
        setEditingMember(null);
    }
  };

  const handleDelete = async (userId: string) => {
      if (confirm('¿Estás seguro de que quieres eliminar a este miembro del equipo?')) {
          await deleteStaffMember(tenantId, userId);
          await refreshData();
      }
  }
  
  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || 'Sin Rol';
  }
  
  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><p>Cargando equipo...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
            <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    setEditingMember(null);
                }
            }}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Invitar Personal
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSaveMember}>
                        <DialogHeader>
                            <DialogTitle>{editingMember ? 'Editar Miembro' : 'Invitar Nuevo Miembro'}</DialogTitle>
                            <DialogDescription>
                                {editingMember 
                                    ? 'Actualiza el rol de este miembro del equipo.'
                                    : 'Introduce el correo electrónico y asigna un rol a la persona que quieres invitar.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Correo Electrónico</Label>
                                <Input id="email" name="email" type="email" defaultValue={editingMember?.email} placeholder="staff@example.com" className="col-span-3" required disabled={!!editingMember}/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="roleId" className="text-right">Rol</Label>
                                <Select name="roleId" defaultValue={editingMember?.roleId} required>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{editingMember ? 'Guardar Cambios' : 'Enviar Invitación'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
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
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${avatarFallback}`} data-ai-hint="foto de perfil"/>
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">
                            <div>{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleName(member.roleId) === "Propietario" ? "default" : "secondary"}>{getRoleName(member.roleId)}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={getRoleName(member.roleId) === 'Propietario'}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menú</span>
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
    </div>
  )
}

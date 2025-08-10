
'use client'

import React, { useState } from "react"
import type { Role } from "../layout"
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

type StaffMember = {
  name: string;
  email: string;
  roleId: string;
  avatar: string;
};

const initialStaffMembers: StaffMember[] = [
  { name: "Jessica Miller", email: "jessica@glamdash.com", roleId: "estilista_principal", avatar: "JM" },
  { name: "Monica Evans", email: "monica@glamdash.com", roleId: "estilista", avatar: "ME" },
  { name: "Sophie Chen", email: "sophie@glamdash.com", roleId: "artista_de_unas", avatar: "SC" },
  { name: "Usuario Admin", email: "admin@glamdash.com", roleId: "propietario", avatar: "AU" },
]

interface StaffPageProps {
  roles: Role[];
}

export default function StaffPage({ roles = [] }: StaffPageProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaffMembers)
  const [open, setOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  const handleOpenDialog = (member: StaffMember | null) => {
    setEditingMember(member);
    setOpen(true);
  };
  
  const handleSaveMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const roleId = (form.elements.namedItem('roleId') as HTMLInputElement).value;

    if (email && roleId) {
      if (editingMember) {
        // Update existing member
        setStaffMembers(
          staffMembers.map((m) =>
            m.email === editingMember.email ? { ...m, email, roleId } : m
          )
        );
      } else {
        // Add new member (invitation)
        const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const avatar = name.split(' ').map(n => n[0]).join('');
        setStaffMembers([...staffMembers, { name, email, roleId, avatar }]);
      }
      setOpen(false);
      setEditingMember(null);
    }
  };

  const handleDelete = (email: string) => {
    setStaffMembers(staffMembers.filter(member => member.email !== email))
  }
  
  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || 'Sin Rol';
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
                                    ? 'Actualiza el correo electrónico y el rol de este miembro del equipo.'
                                    : 'Introduce el correo electrónico y asigna un rol a la persona que quieres invitar.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Correo Electrónico</Label>
                                <Input id="email" name="email" type="email" defaultValue={editingMember?.email} placeholder="staff@example.com" className="col-span-3" required/>
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
              {staffMembers.map((staff) => (
                <TableRow key={staff.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${staff.avatar}`} data-ai-hint="foto de perfil"/>
                        <AvatarFallback>{staff.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        <div>{staff.name}</div>
                        <div className="text-sm text-muted-foreground">{staff.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleName(staff.roleId) === "Propietario" ? "default" : "secondary"}>{getRoleName(staff.roleId)}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={getRoleName(staff.roleId) === 'Propietario'}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(staff)}>Editar Rol</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(staff.email)}>Eliminar del Equipo</DropdownMenuItem>
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

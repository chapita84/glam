
'use client'

import React, { useState } from "react"
import type { Role, Permission } from "../layout"
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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface RolesPageProps {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  allPermissions: Permission[];
}

export default function RolesPage({ roles = [], setRoles, allPermissions = [] }: RolesPageProps) {
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleOpenDialog = (role: Role | null) => {
    setEditingRole(role);
    setOpen(true);
  };

  const handleSaveRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const roleName = (form.elements.namedItem('role-name') as HTMLInputElement).value;
    const selectedPermissions = new Set(
        allPermissions
            .filter(p => (form.elements.namedItem(`perm-${p.id}`) as HTMLInputElement).checked)
            .map(p => p.id)
    );

    if (roleName && setRoles) {
        if (editingRole) {
            setRoles(roles.map(r => r.id === editingRole.id ? { ...r, name: roleName, permissions: selectedPermissions } : r));
        } else {
            const newId = roleName.toLowerCase().replace(/\s+/g, '_');
            setRoles([...roles, { id: newId, name: roleName, permissions: selectedPermissions }]);
        }
        setOpen(false);
        setEditingRole(null);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    if (setRoles) {
      setRoles(roles.filter(r => r.id !== roleId));
    }
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
            <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    setEditingRole(null);
                }
            }}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Rol
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSaveRole}>
                        <DialogHeader>
                            <DialogTitle>{editingRole ? "Editar Rol" : "Crear Nuevo Rol"}</DialogTitle>
                            <DialogDescription>
                                {editingRole ? "Actualiza el nombre y los permisos de este rol." : "Define un nuevo rol y asígnale permisos específicos para tu equipo."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role-name" className="text-right">Nombre</Label>
                                <Input id="role-name" name="role-name" defaultValue={editingRole?.name} placeholder="p. ej. Asistente" className="col-span-3" required/>
                            </div>
                            <div className="space-y-2">
                                <Label>Permisos</Label>
                                <div className="grid gap-2">
                                    {allPermissions.map(p => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <Checkbox 
                                                id={`perm-${p.id}`} 
                                                name={`perm-${p.id}`}
                                                defaultChecked={editingRole?.permissions.has(p.id)}
                                            />
                                            <Label htmlFor={`perm-${p.id}`} className="font-normal">{p.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Guardar Rol</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Tus Roles</CardTitle>
          <CardDescription>
            Gestiona los roles de tu personal y los permisos asociados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Permisos Activos</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant={role.name === "Propietario" ? "default" : "secondary"}>{role.permissions.size} de {allPermissions.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={role.name === 'Propietario'}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(role)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteRole(role.id)}>Eliminar</DropdownMenuItem>
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

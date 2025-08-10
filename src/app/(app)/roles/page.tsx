

'use client'

import React, { useState } from "react"
import type { Role, Permission } from "../layout"
import { addOrUpdateRole, deleteRole } from "@/lib/firebase/firestore";
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
import { Input } from "@/components/ui/input"
import { PlusCircle, Trash2 } from "lucide-react"
import { PermissionsTree } from "@/components/permissions-tree";

interface RolesPageProps {
  roles: Role[];
  allPermissions: Permission[];
  refreshData: () => void;
  loading: boolean;
  tenantId: string;
}

export default function RolesPage({ roles = [], allPermissions = [], refreshData, loading, tenantId }: RolesPageProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  
  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
  };

  const handlePermissionsChange = async (newPermissions: Set<string>) => {
    if (selectedRole) {
      const updatedRole = { 
        ...selectedRole, 
        permissions: Array.from(newPermissions) 
      };
      await addOrUpdateRole(tenantId, updatedRole);
      refreshData();
      // Update selected role in state to reflect changes instantly
      setSelectedRole({...selectedRole, permissions: newPermissions});
    }
  };

  const handleAddNewRole = async () => {
    if (newRoleName.trim() === "") return;
    const newRole = {
      id: newRoleName.toLowerCase().replace(/\s+/g, '_'),
      name: newRoleName,
      permissions: []
    };
    await addOrUpdateRole(tenantId, newRole);
    setNewRoleName("");
    refreshData();
  };

  const handleDeleteRole = async (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    if (roleToDelete?.name === 'Propietario') {
        alert("El rol de Propietario no se puede eliminar.");
        return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar este rol?')) {
      await deleteRole(tenantId, roleId);
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }
      refreshData();
    }
  };

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><p>Cargando roles...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6 h-full">
        <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
        <div className="grid md:grid-cols-2 gap-8 flex-1">
            {/* Columna Izquierda: Lista de Roles */}
            <Card>
                <CardHeader>
                    <CardTitle>Listado de Roles</CardTitle>
                    <CardDescription>
                        Selecciona un rol para editar sus permisos, o crea uno nuevo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Input 
                            placeholder="Nombre del nuevo rol" 
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                        />
                        <Button onClick={handleAddNewRole}><PlusCircle className="mr-2"/> Añadir</Button>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {(roles || []).map((role) => (
                            <TableRow 
                                key={role.id} 
                                onClick={() => handleSelectRole(role)}
                                className={`cursor-pointer ${selectedRole?.id === role.id ? 'bg-muted/80' : ''}`}
                            >
                                <TableCell className="font-medium">{role.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                                        disabled={role.name === 'Propietario'}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Columna Derecha: Árbol de Permisos */}
            <Card>
                 <CardHeader>
                    <CardTitle>Permisos del Rol</CardTitle>
                    <CardDescription>
                        {selectedRole ? `Editando permisos para "${selectedRole.name}"` : "Selecciona un rol para ver sus permisos"}
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    {selectedRole ? (
                        <PermissionsTree 
                            permissions={allPermissions} 
                            rolePermissions={selectedRole.permissions}
                            onPermissionsChange={handlePermissionsChange}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Por favor, selecciona un rol de la lista.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}


'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { useStudioData } from "@/contexts/StudioDataContext";
import { addOrUpdateRole, deleteRole } from "@/lib/firebase/firestore";
import { PermissionsTree } from "@/components/permissions-tree";
import type { Role } from "../layout";
import { useToast } from "@/hooks/use-toast";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function RolesPage() {
  const { roles, studioId, refreshData, loading } = useStudioData();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleDetails, setRoleDetails] = useState<Partial<Role>>({});
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
    }
  }, [roles, selectedRole]);

  useEffect(() => {
    if (selectedRole) {
      setRoleDetails(selectedRole);
      setPermissions(new Set(selectedRole.permissions));
    } else {
      setRoleDetails({ id: '', name: '', description: ''});
      setPermissions(new Set());
    }
  }, [selectedRole]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
  };

  const handleCreateNewRole = () => {
    setSelectedRole(null);
  };

  const handleSave = async () => {
    if (!studioId) return;
    
    const isNewRole = !selectedRole;
    const roleId = isNewRole ? roleDetails.name?.toLowerCase().replace(/\s+/g, '_') : selectedRole.id;

    if (!roleId || !roleDetails.name) {
        toast({ title: "Error", description: "El nombre del rol es obligatorio.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    const roleDataToSave: Role = {
      id: roleId,
      name: roleDetails.name ?? '',
      description: roleDetails.description ?? '',
      permissions: permissions,
    };

    try {
      await addOrUpdateRole(studioId, roleDataToSave);
      await refreshData();
      toast({ title: "Éxito", description: "El rol se ha guardado correctamente." });
      if (isNewRole) {
          const newlyCreatedRole = roles.find(r => r.id === roleId) || { ...roleDataToSave, id: roleId };
          setSelectedRole(newlyCreatedRole);
      }
    } catch (error) {
      toast({ title: "Error", description: `No se pudo guardar el rol: ${error}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (roleIdToDelete: string) => {
    if (!studioId) return;
    if (confirm('¿Estás seguro de que quieres eliminar este rol?')) {
        try {
            await deleteRole(studioId, roleIdToDelete);
            await refreshData();
            toast({ title: "Rol Eliminado" });
            if (selectedRole?.id === roleIdToDelete) {
                setSelectedRole(roles.length > 1 ? roles[0] : null);
            }
        } catch(e) {
            toast({ title: "Error", description: "No se pudo eliminar el rol.", variant: "destructive" });
        }
    }
  };

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><p>Cargando roles...</p></div>;
  }

  return (
    <div className="grid md:grid-cols-[1fr,2fr] gap-6 h-full">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Listado de Roles</CardTitle>
          <CardDescription>Consulta y selecciona un rol para editarlo.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <Button onClick={handleCreateNewRole} className="mb-4 w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Rol
          </Button>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow 
                  key={role.id} 
                  onClick={() => handleSelectRole(role)}
                  className={cn("cursor-pointer", selectedRole?.id === role.id && "bg-muted")}
                >
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(role.id); }} disabled={['owner', 'super_admin'].includes(role.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col max-h-[calc(100vh-10rem)]">
        <CardHeader>
          <CardTitle>{selectedRole ? 'Modificar Rol' : 'Crear Nuevo Rol'}</CardTitle>
          <CardDescription>
            {selectedRole ? `Editando los detalles y permisos para el rol "${selectedRole.name}".` : 'Define los detalles y permisos para un nuevo rol.'}
          </CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow">
            <CardContent className="space-y-6">
                <div className="space-y-4">
                     <div>
                        <Label htmlFor="name">Nombre del Rol</Label>
                        <Input id="name" name="name" value={roleDetails?.name || ''} onChange={(e) => setRoleDetails({...roleDetails, name: e.target.value})} required disabled={!!selectedRole} />
                        { !selectedRole && <p className="text-xs text-muted-foreground mt-1">El ID del rol se generará a partir del nombre (ej: "Mi Rol" se convierte en "mi_rol").</p> }
                    </div>
                    <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" name="description" value={roleDetails?.description || ''} onChange={(e) => setRoleDetails({...roleDetails, description: e.target.value})} placeholder="Describe las responsabilidades de este rol."/>
                    </div>
                </div>
                <PermissionsTree 
                    permissions={ALL_PERMISSIONS} 
                    rolePermissions={permissions}
                    onPermissionsChange={setPermissions}
                />
            </CardContent>
        </ScrollArea>
        <div className="mt-auto p-6 border-t">
            <Button onClick={handleSave} disabled={isSaving || !roleDetails.name} className="w-full">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              {selectedRole ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
        </div>
      </Card>
    </div>
  )
}

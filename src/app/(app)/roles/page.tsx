
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import {
  addOrUpdateStudioRole,
  deleteStudioRole,
  getStudioRoles,
} from '@/lib/firebase/firestore';
import { PermissionsTree } from '@/components/permissions-tree';
import type { StudioRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ALL_PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function RolesPage() {
  const { currentStudio } = useAuth();
  const [roles, setRoles] = useState<StudioRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<StudioRole | null>(null);
  const [roleDetails, setRoleDetails] = useState<Partial<StudioRole>>({
    name: '',
    description: '',
  });
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const refreshData = async () => {
    if (!currentStudio) return;
    setLoading(true);
    try {
      const fetchedRoles = await getStudioRoles(currentStudio.id);
      const filteredRoles = fetchedRoles.filter(role => role.id !== 'owner');
      setRoles(filteredRoles);
      if (filteredRoles.length > 0) {
        setSelectedRole(filteredRoles[0]);
      } else {
        setSelectedRole(null);
      }
    } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar los roles.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStudio) {
      refreshData();
    } else {
      setLoading(false);
      setRoles([]);
      setSelectedRole(null);
    }
  }, [currentStudio]);

  useEffect(() => {
    if (selectedRole) {
      setRoleDetails(selectedRole);
      setPermissions(new Set(selectedRole.permissions || []));
    } else {
      setRoleDetails({ name: '', description: '' });
      setPermissions(new Set());
    }
  }, [selectedRole]);

  const handleCreateNewRole = () => {
    setSelectedRole(null);
  };

  const handleSave = async () => {
    if (!currentStudio || !roleDetails.name) {
      toast({
        title: 'Error',
        description: 'El nombre del rol es obligatorio.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const isNewRole = !selectedRole;
    const roleId = isNewRole ? roleDetails.name.toLowerCase().replace(/\s+/g, '_').trim() : selectedRole.id;
    
    const roleDataToSave: StudioRole = {
      id: roleId,
      name: roleDetails.name,
      description: roleDetails.description ?? '',
      permissions: Array.from(permissions),
    };

    try {
      await addOrUpdateStudioRole(currentStudio.id, roleDataToSave);
      toast({
        title: '¡Éxito!',
        description: 'El rol se ha guardado correctamente.',
      });
      
      // We need to refetch and then find the new role to select it
      const fetchedRoles = await getStudioRoles(currentStudio.id);
      const filtered = fetchedRoles.filter(role => role.id !== 'owner');
      setRoles(filtered);
      setSelectedRole(fetchedRoles.find(r => r.id === roleId) || null);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: `No se pudo guardar el rol: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!currentStudio) return;
    if (confirm('¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer.')) {
        try {
            await deleteStudioRole(currentStudio.id, roleId);
            toast({ title: "Rol Eliminado" });
            setSelectedRole(null);
            await refreshData();
        } catch(e) {
            toast({ title: "Error", description: "No se pudo eliminar el rol.", variant: "destructive" });
        }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!currentStudio) {
    return (
      <div className="flex h-full items-center justify-center">
          <div className="text-center">
              <h1 className="text-2xl font-bold">Gestión de Roles</h1>
              <p className="text-muted-foreground">
                  Selecciona un estudio para ver sus roles.
              </p>
          </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[1fr,2fr] gap-6 h-full p-6">
      <Card>
        <CardHeader>
          <CardTitle>Roles en {currentStudio.name}</CardTitle>
          <Button onClick={handleCreateNewRole} className="mt-4 w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Rol
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {roles.map((role) => (
                <TableRow
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    'cursor-pointer',
                    selectedRole?.id === role.id && 'bg-muted'
                  )}
                >
                  <TableCell>{role.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(role.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Nombre del Rol</Label>
            <Input
              id="name"
              value={roleDetails.name || ''}
              onChange={(e) =>
                setRoleDetails({ ...roleDetails, name: e.target.value })
              }
              disabled={!!selectedRole}
            />
            {!selectedRole && (
              <p className="text-xs text-muted-foreground mt-1">
                El ID se generará a partir del nombre.
              </p>
            )}
          </div>
          <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={roleDetails.description || ''} onChange={(e) => setRoleDetails({...roleDetails, description: e.target.value})} />
          </div>
          <PermissionsTree
            permissions={ALL_PERMISSIONS}
            rolePermissions={permissions}
            onPermissionsChange={setPermissions}
          />
        </CardContent>
        <div className="p-6 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving || !roleDetails.name}
            className="w-full"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedRole ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

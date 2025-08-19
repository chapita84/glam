
'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { getGlobalRoles, addOrUpdateGlobalRole } from "@/lib/firebase/firestore";
import { PermissionsTree } from "@/components/permissions-tree";
import type { Role } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function GlobalRolesPage() {
  const { currentUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleDetails, setRoleDetails] = useState<Partial<Role>>({});
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const globalRoles = await getGlobalRoles();
    setRoles(globalRoles);
    if (globalRoles.length > 0 && !selectedRole) {
        setSelectedRole(globalRoles[0]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      setRoleDetails(selectedRole);
      setPermissions(new Set(selectedRole.permissions));
    }
  }, [selectedRole]);

  const handleSave = async () => {
    if (!roleDetails.name || !selectedRole) {
        toast({ title: "Error", description: "No se puede guardar. Falta el nombre o el rol no está seleccionado.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    const roleDataToSave: Role = {
      id: selectedRole.id,
      name: roleDetails.name,
      description: roleDetails.description ?? '',
      permissions: permissions,
    };

    try {
      await addOrUpdateGlobalRole(roleDataToSave);
      toast({ title: "Éxito", description: "Los permisos del rol global se han actualizado." });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: `No se pudo guardar el rol: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (currentUser?.globalRole !== 'superAdmin') {
    return <Card><CardHeader><CardTitle>Acceso Denegado</CardTitle><CardDescription>No tienes permiso para ver esta página.</CardDescription></CardHeader></Card>;
  }
  
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="grid md:grid-cols-[1fr,2fr] gap-6 h-full p-6">
      <Card>
        <CardHeader>
          <CardTitle>Roles Globales</CardTitle>
          <CardDescription>Edita los permisos para roles a nivel de plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} onClick={() => setSelectedRole(role)} className={cn("cursor-pointer", selectedRole?.id === role.id && "bg-muted")}>
                  <TableCell>{role.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Editando Rol: {selectedRole?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label>Nombre del Rol</Label>
                <Input value={roleDetails.name || ''} disabled />
            </div>
            <div>
                <Label>Descripción</Label>
                <Textarea value={roleDetails.description || ''} onChange={(e) => setRoleDetails({...roleDetails, description: e.target.value})} />
            </div>
            <PermissionsTree permissions={ALL_PERMISSIONS} rolePermissions={permissions} onPermissionsChange={setPermissions}/>
        </CardContent>
        <div className="p-6 border-t">
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Guardar Cambios
            </Button>
        </div>
      </Card>
    </div>
  )
}

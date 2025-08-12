
'use client'

import React, { useMemo } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Permission } from '@/app/(app)/layout';
import { Button } from './ui/button';

interface PermissionsTreeProps {
  permissions: Permission[];
  rolePermissions: Set<string>;
  onPermissionsChange: (newPermissions: Set<string>) => void;
}

const getAllPermissionIds = (permissions: Permission[]): string[] => {
  return permissions.flatMap(p => [p.id, ...(p.children ? getAllPermissionIds(p.children) : [])]);
};

const PermissionNode = ({ permission, rolePermissions, onToggle, level = 0 }: { permission: Permission, rolePermissions: Set<string>, onToggle: (id: string, checked: boolean) => void, level?: number }) => {
  const isChecked = rolePermissions.has(permission.id);
  
  const childrenIds = permission.children ? getAllPermissionIds(permission.children) : [];
  const areAllChildrenChecked = childrenIds.length > 0 && childrenIds.every(id => rolePermissions.has(id));
  
  // A parent is 'checked' if itself OR all its children are checked.
  const finalIsChecked = isChecked || areAllChildrenChecked;

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <div style={{ paddingLeft: `${level * 1.5}rem` }} className="flex items-center space-x-2 flex-grow">
           {level > 0 && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-px bg-border" style={{ left: `${(level - 1) * 1.5 + 0.5}rem`}}></span>}
           <Checkbox
            id={permission.id}
            checked={finalIsChecked}
            onCheckedChange={(checked) => onToggle(permission.id, !!checked)}
          />
          <Label htmlFor={permission.id} className="font-normal cursor-pointer">
            {permission.label}
          </Label>
        </div>
      </div>
      {permission.children && (
        <div className="relative mt-2 pl-6 border-l border-dashed border-border">
          {permission.children.map((child) => (
            <div key={child.id} className="mt-2">
              <PermissionNode 
                permission={child} 
                rolePermissions={rolePermissions}
                onToggle={onToggle}
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function PermissionsTree({ permissions, rolePermissions, onPermissionsChange }: PermissionsTreeProps) {
  
  const allPermissionIds = useMemo(() => getAllPermissionIds(permissions), [permissions]);

  const handleToggle = (permissionId: string, checked: boolean) => {
    const newPermissions = new Set(rolePermissions);
    const permission = findPermissionById(permissions, permissionId);
    const childrenIds = permission && permission.children ? getAllPermissionIds(permission.children) : [];

    const toggle = (id: string, check: boolean) => {
        if(check) newPermissions.add(id);
        else newPermissions.delete(id);
    }

    toggle(permissionId, checked);
    childrenIds.forEach(id => toggle(id, checked));
    
    onPermissionsChange(newPermissions);
  };
  
  const findPermissionById = (permissions: Permission[], id: string): Permission | null => {
      for (const p of permissions) {
          if (p.id === id) return p;
          if (p.children) {
              const found = findPermissionById(p.children, id);
              if (found) return found;
          }
      }
      return null;
  }

  const handleSelectAll = () => {
    onPermissionsChange(new Set(allPermissionIds));
  }
  
  const handleDeselectAll = () => {
      onPermissionsChange(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
            <h3 className="text-lg font-semibold">Permisos</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona los permisos para este rol.
            </p>
        </div>
        <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>Seleccionar Todos</Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>Anular Selección</Button>
        </div>
      </div>
      <div className="space-y-4 rounded-lg border p-4">
        {permissions.map((permission) => (
          <PermissionNode 
            key={permission.id} 
            permission={permission} 
            rolePermissions={rolePermissions}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}

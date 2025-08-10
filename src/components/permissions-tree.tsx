
'use client';

import React, { useState, useEffect } from 'react';
import { type Permission } from '@/app/(app)/layout';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save } from 'lucide-react';

interface PermissionsTreeProps {
  permissions: Permission[];
  rolePermissions: Set<string>;
  onPermissionsChange: (newPermissions: Set<string>) => void;
}

export function PermissionsTree({ permissions, rolePermissions, onPermissionsChange }: PermissionsTreeProps) {
  const [checkedPermissions, setCheckedPermissions] = useState(new Set(rolePermissions));
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if the selected role (and its permissions) changes
  useEffect(() => {
    setCheckedPermissions(new Set(rolePermissions));
  }, [rolePermissions]);

  const getChildPermissionIds = (permission: Permission): string[] => {
    let ids: string[] = [];
    if (permission.children) {
      permission.children.forEach(child => {
        ids.push(child.id);
        ids = ids.concat(getChildPermissionIds(child));
      });
    }
    return ids;
  };

  const findPermissionAndParent = (perms: Permission[], id: string, parent?: Permission): { p: Permission, parent: Permission | undefined } | null => {
      for (const p of perms) {
          if (p.id === id) return { p, parent };
          if (p.children) {
              const found = findPermissionAndParent(p.children, id, p);
              if (found) return found;
          }
      }
      return null;
  }

  const handleCheckChange = (permissionId: string, isChecked: boolean) => {
    const newChecked = new Set(checkedPermissions);

    const updateChildren = (perm: Permission, check: boolean) => {
        const childIds = getChildPermissionIds(perm);
        [perm.id, ...childIds].forEach(id => {
            if (check) newChecked.add(id);
            else newChecked.delete(id);
        });
    };
    
    const permissionInfo = findPermissionAndParent(permissions, permissionId);
    if (permissionInfo) {
      updateChildren(permissionInfo.p, isChecked);
    }
    
    // Check parents upwards
    const updateParents = (id: string) => {
        const info = findPermissionAndParent(permissions, id);
        if (info && info.parent) {
            const parent = info.parent;
            const parentChildIds = getChildPermissionIds(parent);
            const allChildrenChecked = parentChildIds.every(cid => newChecked.has(cid));

            if (allChildrenChecked) {
                newChecked.add(parent.id);
            } else {
                newChecked.delete(parent.id);
            }
            updateParents(parent.id); // Recurse upwards
        }
    };
    
    updateParents(permissionId);
    setCheckedPermissions(newChecked);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    await onPermissionsChange(checkedPermissions);
    setIsSaving(false);
  };

  const renderPermission = (permission: Permission, level: number = 0) => {
    const allChildIds = getChildPermissionIds(permission);
    const checkedChildrenCount = allChildIds.filter(id => checkedPermissions.has(id)).length;
    
    const isChecked = checkedPermissions.has(permission.id) || (allChildIds.length > 0 && checkedChildrenCount === allChildIds.length);
    const isIndeterminate = allChildIds.length > 0 && checkedChildrenCount > 0 && checkedChildrenCount < allChildIds.length;

    return (
      <div key={permission.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            id={permission.id}
            checked={isChecked}
            // @ts-ignore - Radix supports indeterminate state
            onCheckedChange={(checked) => handleCheckChange(permission.id, checked === 'indeterminate' ? true : !!checked)}
            data-state={isIndeterminate ? 'indeterminate' : (isChecked ? 'checked' : 'unchecked')}
          />
          <label htmlFor={permission.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {permission.label}
          </label>
        </div>
        {permission.children && (
          <div className="border-l-2 border-muted-foreground/20 pl-4">
            {permission.children.map(child => renderPermission(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-2 py-2">
            {permissions.map(permission => renderPermission(permission))}
        </div>
      </ScrollArea>
      <div className="mt-4 pt-4 border-t">
        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Permisos'}
        </Button>
      </div>
    </div>
  );
}

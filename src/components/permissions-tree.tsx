// src/components/permissions-tree.tsx
'use client';

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Permission } from '@/lib/types';

interface PermissionsTreeProps {
  permissions: Permission[];
  rolePermissions: Set<string>;
  onPermissionsChange: (newPermissions: Set<string>) => void;
}

export function PermissionsTree({ permissions, rolePermissions, onPermissionsChange }: PermissionsTreeProps) {
  
  const handleParentChange = (parent: Permission, isChecked: boolean) => {
    const newPermissions = new Set(rolePermissions);
    const childIds = parent.children?.map(c => c.id) || [];

    if (isChecked) {
      newPermissions.add(parent.id);
      childIds.forEach(id => newPermissions.add(id));
    } else {
      newPermissions.delete(parent.id);
      childIds.forEach(id => newPermissions.delete(id));
    }
    onPermissionsChange(newPermissions);
  };

  const handleChildChange = (parentId: string, childId: string, isChecked: boolean) => {
    const newPermissions = new Set(rolePermissions);
    if (isChecked) {
      newPermissions.add(childId);
      newPermissions.add(parentId);
    } else {
      newPermissions.delete(childId);
      
      const parent = permissions.find(p => p.id === parentId);
      const hasOtherSelectedChildren = parent?.children?.some(c => c.id !== childId && newPermissions.has(c.id));
      if (!hasOtherSelectedChildren) {
          newPermissions.delete(parentId);
      }
    }
    onPermissionsChange(newPermissions);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Permisos del Rol</h3>
      <Accordion type="multiple" defaultValue={permissions.map(p => p.id)} className="w-full">
        {permissions.map((parent) => {
          const allChildrenSelected = parent.children?.every(c => rolePermissions.has(c.id));
          const isParentChecked = rolePermissions.has(parent.id) && allChildrenSelected;

          return (
            <AccordionItem value={parent.id} key={parent.id}>
              {/* This div is the key to the fix. Checkbox and Trigger are now siblings. */}
              <div className="flex items-center space-x-3 w-full p-4">
                <Checkbox
                  id={`parent-${parent.id}`}
                  checked={isParentChecked}
                  onCheckedChange={(checked) => handleParentChange(parent, !!checked)}
                />
                <AccordionTrigger className="p-0 flex-1 text-left">
                  <Label htmlFor={`parent-${parent.id}`} className="font-semibold text-base cursor-pointer">
                    {parent.label}
                  </Label>
                </AccordionTrigger>
              </div>
              <AccordionContent>
                <div className="pl-12 space-y-4 pt-2 pb-4">
                  {parent.children?.map((child) => (
                    <div className="flex items-center space-x-3" key={child.id}>
                      <Checkbox
                        id={child.id}
                        checked={rolePermissions.has(child.id)}
                        onCheckedChange={(checked) => handleChildChange(parent.id, child.id, !!checked)}
                      />
                      <Label htmlFor={child.id}>{child.label}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

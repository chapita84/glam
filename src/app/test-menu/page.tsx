// src/app/test-menu/page.tsx

'use client';

import { DynamicMenu, ProtectedMenuItem, Protected } from '@/components/dynamic-menu';
import { Button } from '@/components/ui/button';
import { MAIN_MENU, CUSTOMER_MENU, QUICK_ACTIONS } from '@/lib/menu-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestMenuPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Test del Sistema de Menús Dinámicos</h1>
        <p className="text-muted-foreground">
          Esta página demuestra las capacidades del sistema de menús basado en permisos.
        </p>
      </div>

      {/* Test Main Menu */}
      <Card>
        <CardHeader>
          <CardTitle>Menú Principal</CardTitle>
          <CardDescription>
            Menú filtrado por permisos del usuario actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicMenu items={MAIN_MENU}>
            {(visibleItems) => (
              <div className="space-y-2">
                {visibleItems.map((item) => {
                  if (item.divider) {
                    return <hr key={item.id} className="my-4" />;
                  }
                  
                  if (item.children) {
                    return (
                      <div key={item.id} className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                          {item.label}
                        </h4>
                        <div className="ml-4 space-y-1">
                          {item.children.map((child) => (
                            <Button
                              key={child.id}
                              variant="ghost"
                              className="w-full justify-start"
                              asChild
                            >
                              <a href={child.href}>
                                {child.icon && <child.icon className="mr-2 h-4 w-4" />}
                                {child.label}
                              </a>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <Button
                      key={item.id}
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={item.href}>
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        {item.label}
                      </a>
                    </Button>
                  );
                })}
              </div>
            )}
          </DynamicMenu>
        </CardContent>
      </Card>

      {/* Test Customer Menu */}
      <Card>
        <CardHeader>
          <CardTitle>Menú de Cliente</CardTitle>
          <CardDescription>
            Menú específico para usuarios con rol de cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicMenu items={CUSTOMER_MENU}>
            {(visibleItems) => (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {visibleItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    asChild
                  >
                    <a href={item.href}>
                      {item.icon && <item.icon className="h-6 w-6" />}
                      {item.label}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </DynamicMenu>
        </CardContent>
      </Card>

      {/* Test Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Botones de acción rápida filtrados por permisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicMenu items={QUICK_ACTIONS}>
            {(visibleItems) => (
              <div className="flex gap-2 flex-wrap">
                {visibleItems.map((item) => (
                  <Button
                    key={item.id}
                    onClick={item.onClick}
                    className="gap-2"
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Button>
                ))}
              </div>
            )}
          </DynamicMenu>
        </CardContent>
      </Card>

      {/* Test Individual Protected Components */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes Protegidos Individuales</CardTitle>
          <CardDescription>
            Ejemplos de uso del componente Protected para mostrar/ocultar elementos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Protected permission="appointments:manage">
            <div className="p-4 bg-green-100 border border-green-300 rounded">
              ✅ Tienes permiso para gestionar citas - este contenido es visible
            </div>
          </Protected>
          
          <Protected permission="admin:manage-users">
            <div className="p-4 bg-blue-100 border border-blue-300 rounded">
              ✅ Tienes permisos de administrador - este contenido es visible
            </div>
          </Protected>
          
          <Protected permissions={["staff:manage", "settings:manage-studio"]}>
            <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
              ✅ Tienes al menos uno de estos permisos: gestionar staff O gestionar estudio
            </div>
          </Protected>
          
          <Protected requireAll={["settings:manage-studio", "settings:manage-roles"]}>
            <div className="p-4 bg-purple-100 border border-purple-300 rounded">
              ✅ Tienes TODOS estos permisos: gestionar estudio Y gestionar roles
            </div>
          </Protected>
          
          {/* This should be hidden for most users */}
          <Protected permission="nonexistent:permission">
            <div className="p-4 bg-red-100 border border-red-300 rounded">
              ❌ Este contenido no debería ser visible (permiso inexistente)
            </div>
          </Protected>
        </CardContent>
      </Card>
    </div>
  );
}

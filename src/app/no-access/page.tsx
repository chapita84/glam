'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail } from 'lucide-react';

export default function NoAccessPage() {
  const { profile, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle>Acceso Restringido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Tu cuenta ({profile?.email}) no tiene acceso a ningún estudio en este momento.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Para obtener acceso:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Contacta al administrador de tu estudio</li>
              <li>• Verifica que tu cuenta esté correctamente configurada</li>
              <li>• Solicita permisos para acceder al sistema</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => window.location.href = 'mailto:support@glamdash.com'}>
              <Mail className="mr-2 h-4 w-4" />
              Contactar Soporte
            </Button>
            <Button onClick={logout} variant="secondary">
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

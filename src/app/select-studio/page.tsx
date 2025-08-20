
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { type Studio } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function SelectStudioPage() {
  console.log("DEBUG: Renderizando /select-studio page");

  const { profile, memberships, setCurrentStudio, loading: authLoading, logout } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isLoadingStudios, setIsLoadingStudios] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStudios = async () => {
      if (authLoading || !profile) {
        console.log("DEBUG: [fetchStudios] Saltando fetch porque authLoading o no hay perfil.");
        return;
      }
      
      console.log(`DEBUG: [fetchStudios] Iniciando carga de estudios para rol: ${profile.globalRole}`);
      setIsLoadingStudios(true);
      let studioDocs: any[] = [];

      try {
        if (profile.globalRole === 'superAdmin') {
          console.log("DEBUG: [fetchStudios] Super Admin, cargando TODOS los estudios.");
          const studiosSnapshot = await getDocs(collection(db, 'studios'));
          studioDocs = studiosSnapshot.docs;
        } else if (profile.globalRole === 'owner' || profile.globalRole === 'staff') {
          console.log(`DEBUG: [fetchStudios] Cargando estudios para ${profile.globalRole}.`);
          
          // Para owners y staff, usar solo membresías ya que las reglas no permiten consultas where por ownerId
          if (memberships.length > 0) {
            console.log(`DEBUG: [fetchStudios] Cargando ${memberships.length} estudios desde membresías.`);
            
            // Usar getDoc directo para cada estudio (permitido por reglas)
            const studioPromises = memberships.map(async (membership) => {
              try {
                const studioDoc = await getDoc(doc(db, 'studios', membership.studioId));
                return studioDoc;
              } catch (error) {
                console.error(`Error cargando estudio ${membership.studioId}:`, error);
                return null;
              }
            });
            
            const studioResults = await Promise.all(studioPromises);
            studioDocs = studioResults.filter((doc): doc is any => doc !== null && doc.exists());
          }
        } else if (profile.globalRole === 'customer') {
          // Los customers no deberían estar aquí, pero por si acaso mostramos estudios públicos
          console.log("DEBUG: [fetchStudios] Customer detectado, redirigiendo...");
          router.push('/customer');
          return;
        }
        
        const studiosData = studioDocs
          .filter((doc) => doc.exists())
          .map((doc) => ({ id: doc.id, ...doc.data() } as Studio));
        
        console.log(`DEBUG: [fetchStudios] Se encontraron y procesaron ${studiosData.length} estudios.`, studiosData);
        setStudios(studiosData);

        // Auto-redireccionar si solo hay un estudio disponible
        if (studiosData.length === 1) {
          console.log("DEBUG: [fetchStudios] Solo un estudio disponible, auto-redirigiendo...");
          const singleStudio = studiosData[0];
          await setCurrentStudio(singleStudio);
          router.push('/dashboard');
          return;
        }

      } catch (error) {
        console.error("DEBUG: [fetchStudios] Error cargando estudios:", error);
      } finally {
        setIsLoadingStudios(false);
        console.log("DEBUG: [fetchStudios] Carga de estudios finalizada.");
      }
    };

    fetchStudios();
  }, [profile, memberships, authLoading]);

  const handleSelectStudio = async (studio: Studio) => {
    console.log(`DEBUG: [handleSelectStudio] Estudio seleccionado:`, studio);
    await setCurrentStudio(studio);
    console.log("DEBUG: [handleSelectStudio] Redirigiendo a /dashboard...");
    router.push('/dashboard');
  };

  if (authLoading || isLoadingStudios) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center p-4">
      <div className="mb-4 flex w-full max-w-4xl items-center justify-between">
        <h1 className="text-3xl font-bold">Selecciona un Estudio</h1>
        <Button onClick={logout} variant="outline">
          Cerrar Sesión (Debug)
        </Button>
      </div>
      {studios.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studios.map((studio) => (
            <Card
              key={studio.id}
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleSelectStudio(studio)}
            >
              <CardHeader>
                <CardTitle>{studio.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Acceder al panel de gestión de {studio.name}.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>
          {profile?.globalRole === 'owner' || profile?.globalRole === 'staff'
            ? 'No estás asignado a ningún estudio.'
            : 'No hay estudios creados en la plataforma.'}
        </p>
      )}
    </div>
  );
}

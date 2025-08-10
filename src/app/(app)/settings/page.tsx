
'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { type TenantConfig, updateTenantConfig } from "@/lib/firebase/firestore"
import { Loader2 } from "lucide-react"

const daysOfWeek = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
  { id: 0, label: "Domingo" },
];

interface SettingsPageProps {
  config: TenantConfig | null;
  tenantId: string;
  refreshData: () => void;
  loading: boolean;
}

export default function SettingsPage({ config: initialConfig, tenantId, refreshData, loading: initialLoading }: SettingsPageProps) {
  const [config, setConfig] = useState<TenantConfig | null>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Sincronizar el estado local cuando las props cambian (después de la carga inicial o refresco)
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleWorkingHoursChange = (dayId: number, field: 'startTime' | 'endTime' | 'enabled', value: string | boolean) => {
    setConfig(prevConfig => {
      if (!prevConfig) return null;
      
      const newWorkingHours = prevConfig.workingHours ? [...prevConfig.workingHours] : [];
      let dayFound = false;

      // Buscar y actualizar el día
      const updatedHours = newWorkingHours.map(d => {
        if (d.dayOfWeek === dayId) {
          dayFound = true;
          return { ...d, [field]: value };
        }
        return d;
      });

      // Si el día no se encontró, añadirlo
      if (!dayFound) {
        const defaultDay = { dayOfWeek: dayId, startTime: "09:00", endTime: "18:00", enabled: false };
        updatedHours.push({ ...defaultDay, [field]: value });
      }
      
      updatedHours.sort((a,b) => a.dayOfWeek - b.dayOfWeek);

      return { ...prevConfig, workingHours: updatedHours };
    });
  };

  const handleSave = async () => {
      if (!config || !tenantId) {
          toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
          return;
      }
      setIsSaving(true);
      try {
          // El ordenamiento ya se hace en handleWorkingHoursChange, pero lo aseguramos aquí.
          const configToSave = {
              ...config,
              workingHours: [...config.workingHours].sort((a,b) => a.dayOfWeek - b.dayOfWeek)
          };
          await updateTenantConfig(tenantId, configToSave);
          toast({ title: "Éxito", description: "La configuración se ha guardado correctamente." });
          await refreshData();
      } catch (error) {
           toast({ title: "Error", description: "Hubo un problema al guardar la configuración.", variant: "destructive" });
           console.error(error);
      } finally {
          setIsSaving(false);
      }
  };

  if (initialLoading || !config) {
    return <div className="flex h-full w-full items-center justify-center"><p>Cargando configuración...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar Cambios
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios Laborables</CardTitle>
          <CardDescription>
            Define los días y horas en que tu estudio está abierto para recibir citas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map(({ id, label }) => {
            const dayConfig = config.workingHours?.find(d => d.dayOfWeek === id) || { enabled: false, startTime: "09:00", endTime: "18:00" };
            return (
              <div key={id} className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                   <Switch
                      id={`enabled-${id}`}
                      checked={dayConfig.enabled}
                      onCheckedChange={(checked) => handleWorkingHoursChange(id, 'enabled', checked)}
                    />
                  <Label htmlFor={`enabled-${id}`} className="w-24 text-lg font-medium">{label}</Label>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <Label htmlFor={`start-${id}`}>Apertura</Label>
                    <Input
                      id={`start-${id}`}
                      type="time"
                      value={dayConfig.startTime}
                      onChange={(e) => handleWorkingHoursChange(id, 'startTime', e.target.value)}
                      disabled={!dayConfig.enabled}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`end-${id}`}>Cierre</Label>
                    <Input
                      id={`end-${id}`}
                      type="time"
                      value={dayConfig.endTime}
                      onChange={(e) => handleWorkingHoursChange(id, 'endTime', e.target.value)}
                      disabled={!dayConfig.enabled}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  );
}

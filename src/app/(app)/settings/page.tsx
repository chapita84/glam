
'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { updateStudioConfig, getStudioConfig } from "@/lib/firebase/firestore"
import { Loader2 } from "lucide-react"

const dayNames: { [key: number]: string } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };

export default function SettingsPage() {
  const { currentStudio } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [initialConfig, setInitialConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  console.log('🏪 SettingsPage render - currentStudio:', currentStudio);
  console.log('🏪 SettingsPage render - config:', config);
  console.log('🏪 SettingsPage render - loading:', loading);

  // Load studio config when component mounts or studio changes
  useEffect(() => {
    const loadConfig = async () => {
      if (!currentStudio?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const studioConfig = await getStudioConfig(currentStudio.id);
        setInitialConfig(studioConfig);
        setConfig(studioConfig);
      } catch (error) {
        console.error('Error loading studio config:', error);
        toast({ title: "Error", description: "No se pudo cargar la configuración.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [currentStudio?.id, toast]);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    } else {
        // Initialize with default values if no config is present
        setConfig({
            workingHours: Array.from({ length: 7 }, (_, i) => ({
                dayOfWeek: i,
                startTime: '09:00',
                endTime: '18:00',
                enabled: i > 0 && i < 6, // Mon-Fri enabled by default
            }))
        })
    }
  }, [initialConfig]);

  const handleTimeChange = (day: number, field: 'startTime' | 'endTime', value: string) => {
    if (config) {
        const newWorkingHours = config.workingHours.map((wh: any) => 
            wh.dayOfWeek === day ? { ...wh, [field]: value } : wh
        );
        setConfig({ ...config, workingHours: newWorkingHours });
    }
  }

  const handleEnableToggle = (day: number, enabled: boolean) => {
    if (config) {
        const newWorkingHours = config.workingHours.map((wh: any) => 
            wh.dayOfWeek === day ? { ...wh, enabled } : wh
        );
        setConfig({ ...config, workingHours: newWorkingHours });
    }
  }

  const handleSave = async () => {
    console.log('🔧 handleSave called');
    console.log('🔧 currentStudio:', currentStudio);
    console.log('🔧 config:', config);
    
    if (!currentStudio?.id || !config) {
      console.log('🔧 Missing studio ID or config, returning early');
      return;
    }
    
    setIsSaving(true);
    console.log('🔧 Starting save process...');
    
    try {
        console.log('🔧 Calling updateStudioConfig...');
        await updateStudioConfig(currentStudio.id, config);
        console.log('🔧 updateStudioConfig completed');
        
        console.log('🔧 Reloading config...');
        const updatedConfig = await getStudioConfig(currentStudio.id);
        setConfig(updatedConfig);
        setInitialConfig(updatedConfig);
        console.log('🔧 Config reloaded');
        
        toast({ title: "Configuración Guardada", description: "Tus ajustes se han actualizado." });
        console.log('🔧 Save process completed successfully');
    } catch (error) {
        console.error('🔧 Error saving config:', error);
        toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    } finally {
        setIsSaving(false);
        console.log('🔧 Save process finished');
    }
  }

  if (loading) {
      return <div>Cargando configuración...</div>;
  }
  
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Horario de Trabajo</CardTitle>
          <CardDescription>Define los días y horas en que tu estudio está abierto para recibir citas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.workingHours.sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek).map((wh: any) => (
            <div key={wh.dayOfWeek} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
              <div className="w-full md:w-1/4 font-semibold">{dayNames[wh.dayOfWeek]}</div>
              <div className="flex-grow flex items-center gap-4">
                 <div className="flex-1">
                    <Label htmlFor={`start-time-${wh.dayOfWeek}`}>Desde</Label>
                    <Input 
                        id={`start-time-${wh.dayOfWeek}`}
                        type="time" 
                        value={wh.startTime} 
                        onChange={e => handleTimeChange(wh.dayOfWeek, 'startTime', e.target.value)}
                        disabled={!wh.enabled}
                    />
                 </div>
                 <div className="flex-1">
                    <Label htmlFor={`end-time-${wh.dayOfWeek}`}>Hasta</Label>
                    <Input 
                        id={`end-time-${wh.dayOfWeek}`}
                        type="time" 
                        value={wh.endTime} 
                        onChange={e => handleTimeChange(wh.dayOfWeek, 'endTime', e.target.value)}
                        disabled={!wh.enabled}
                    />
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Label htmlFor={`enabled-${wh.dayOfWeek}`} className="text-sm">Abierto</Label>
                 <Switch 
                    id={`enabled-${wh.dayOfWeek}`}
                    checked={wh.enabled} 
                    onCheckedChange={checked => handleEnableToggle(wh.dayOfWeek, checked)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Guardar Cambios
        </Button>
      </div>
    </div>
  )
}

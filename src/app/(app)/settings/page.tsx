
'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useStudioData } from "@/contexts/StudioDataContext"
import { type StudioConfig, updateStudioConfig } from "@/lib/firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const dayNames: { [key: number]: string } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };

export default function SettingsPage() {
  const { studioId, config: initialConfig, refreshData, loading: dataLoading } = useStudioData();
  const [config, setConfig] = useState<StudioConfig | null>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
        const newWorkingHours = config.workingHours.map(wh => 
            wh.dayOfWeek === day ? { ...wh, [field]: value } : wh
        );
        setConfig({ ...config, workingHours: newWorkingHours });
    }
  }

  const handleEnableToggle = (day: number, enabled: boolean) => {
    if (config) {
        const newWorkingHours = config.workingHours.map(wh => 
            wh.dayOfWeek === day ? { ...wh, enabled } : wh
        );
        setConfig({ ...config, workingHours: newWorkingHours });
    }
  }

  const handleSave = async () => {
    if (!studioId || !config) return;
    setIsSaving(true);
    try {
        await updateStudioConfig(studioId, config);
        await refreshData();
        toast({ title: "Configuración Guardada", description: "Tus ajustes se han actualizado." });
    } catch (error) {
        toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  if (dataLoading) {
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
          {config?.workingHours.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map(wh => (
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


'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateStudio, createStudio, Studio } from "@/lib/firebase/firestore";
import { Loader2 } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { getAuth, User } from "firebase/auth";

export default function StudioPage() {
  const { studio, loading: studioLoading, refreshStudio } = useStudio();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const auth = getAuth();
  const user = auth.currentUser;

  const [formData, setFormData] = useState<Partial<Studio>>({
    name: '',
    location: '',
    phone: '',
    description: '',
  });

  // When the component loads or the studio context changes, update the form data.
  useEffect(() => {
    if (studio) {
      setFormData(studio);
    } else {
      // If there is no studio, reset the form to be blank for creation
      setFormData({ name: '', location: '', phone: '', description: '' });
    }
  }, [studio]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión para guardar.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);

    try {
      // If there is no studio object in the context, it means we need to create one.
      if (!studio) {
        if (!formData.name) {
            toast({ title: "Error", description: "El nombre del estudio es obligatorio.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        await createStudio(formData.name, user);
        toast({ title: "¡Estudio Creado!", description: "Tu estudio ha sido guardado correctamente." });
      } 
      // If a studio exists, we update it.
      else {
        await updateStudio(studio.id, formData);
        toast({ title: "¡Estudio Actualizado!", description: "Los cambios se han guardado." });
      }
      
      // Refresh the studio context to get the latest data across the app
      await refreshStudio();

    } catch (error) {
      console.error("Save/Create failed:", error);
      toast({ title: "Error", description: "No se pudo guardar la información.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (studioLoading) {
    return <div className="flex h-full w-full items-center justify-center"><p>Cargando información del estudio...</p></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Estudio</CardTitle>
        <CardDescription>
          {studio ? "Actualiza la información pública de tu estudio." : "Completa los siguientes datos para dar de alta tu estudio."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Estudio</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} placeholder="Ej: Estudio Belleza Total" required/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input id="location" name="location" value={formData.location} onChange={handleFormChange} placeholder="Ej: Av. Corrientes 123, Buenos Aires" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="Ej: +54 9 11 1234-5678" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} placeholder="Describe tu estudio, tus servicios y lo que te hace especial." />
            </div>
            <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}

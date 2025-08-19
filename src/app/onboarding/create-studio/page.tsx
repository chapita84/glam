
'use client'

import { createStudio, type Studio } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/contexts/StudioContext";

export default function CreateStudioPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const { setSelectedStudio } = useStudio();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    // Redirect if user is not logged in after loading has completed
    useEffect(() => {
        if (!authLoading && !currentUser) {
            toast({ title: "Acceso Denegado", description: "Debes iniciar sesión para crear un estudio.", variant: "destructive" });
            router.push('/login');
        }
    }, [authLoading, currentUser, router, toast]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Double-check user existence before submission
        if (!currentUser) {
            toast({ title: "Error", description: "El usuario no está disponible. Por favor, intenta de nuevo.", variant: "destructive" });
            return;
        }

        setIsCreating(true);
        const formData = new FormData(event.currentTarget);
        const studioName = formData.get("studioName") as string;

        if (studioName) {
            try {
                const newStudio: Studio = await createStudio(studioName, currentUser);
                setSelectedStudio(newStudio);
                toast({ title: "¡Estudio Creado!", description: "Bienvenido a tu nuevo espacio de gestión." });
                router.push('/dashboard');
            } catch (error: any) {
                toast({ title: "Error", description: `No se pudo crear el estudio: ${error.message}`, variant: "destructive" });
                setIsCreating(false);
            }
        } else {
             toast({ title: "Error", description: "Por favor, proporciona un nombre para el estudio.", variant: "destructive" });
             setIsCreating(false);
        }
    };

    // Show a loader while auth is being verified
    if (authLoading || !currentUser) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Crea tu Estudio</CardTitle>
                    <CardDescription>
                        Dale un nombre a tu espacio de trabajo. Podrás cambiarlo más tarde.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="studioName">Nombre del Estudio</Label>
                                <Input
                                    id="studioName"
                                    name="studioName"
                                    placeholder="p. ej. 'Estudio de Belleza Glamour'"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear y Continuar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}


'use client'

import { createStudio } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CreateStudioPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsCreating(true);
        const formData = new FormData(event.currentTarget);
        const studioName = formData.get("studioName") as string;

        if (user && studioName) {
            try {
                await createStudio(studioName, user);
                toast({ title: "¡Estudio Creado!", description: "Bienvenido a tu nuevo espacio de gestión." });
                router.push('/dashboard');
            } catch (error: any) {
                toast({ title: "Error", description: `No se pudo crear el estudio: ${error.message}`, variant: "destructive" });
                setIsCreating(false);
            }
        } else {
             toast({ title: "Error", description: "Debes iniciar sesión y proporcionar un nombre para el estudio.", variant: "destructive" });
             setIsCreating(false);
        }
    };

    if (loading) {
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

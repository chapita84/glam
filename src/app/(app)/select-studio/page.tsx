
'use client'

import React, { useState, useEffect } from 'react';
import { getAllStudios, type Studio } from '@/lib/firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { useStudio } from '@/contexts/StudioContext';
import { useRouter } from 'next/navigation';

export default function SelectStudioPage() {
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);
    const { setStudio } = useStudio();
    const router = useRouter();

    useEffect(() => {
        async function fetchStudios() {
            setLoading(true);
            const allStudios = await getAllStudios();
            setStudios(allStudios);
            setLoading(false);
        }
        fetchStudios();
    }, []);

    const handleSelectStudio = (studio: Studio) => {
        setStudio(studio);
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Cargando estudios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight">Selecciona un Estudio</h1>
                <p className="text-muted-foreground mt-2">Elige el estudio con el que quieres trabajar hoy.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {studios.map((studio) => (
                    <Card key={studio.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>{studio.name}</CardTitle>
                            <CardDescription>{studio.location || 'Ubicación no especificada'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => handleSelectStudio(studio)} className="w-full">
                                Seleccionar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type Budget } from '@/lib/types';
import { BudgetSummary } from '@/components/budget-summary';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Download, Loader2 } from 'lucide-react';
import { BudgetDownloadButton } from '@/components/budget-download-button';
import { useToast } from '@/hooks/use-toast';

export default function BudgetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { currentStudio } = useAuth();
    const { toast } = useToast();
    const [budget, setBudget] = useState<Budget | null>(null);
    const [loading, setLoading] = useState(true);

    const budgetId = params.id as string;

    useEffect(() => {
        async function fetchBudget() {
            if (!currentStudio || !budgetId) {
                setLoading(false);
                return;
            }

            try {
                const budgetDoc = doc(db, 'studios', currentStudio.id, 'budgets', budgetId);
                const budgetSnap = await getDoc(budgetDoc);
                
                if (budgetSnap.exists()) {
                    const budgetData = { ...budgetSnap.data(), id: budgetSnap.id } as Budget;
                    setBudget(budgetData);
                } else {
                    toast({
                        title: 'Error',
                        description: 'El presupuesto no fue encontrado.',
                        variant: 'destructive',
                    });
                    router.push('/budgets');
                }
            } catch (error) {
                console.error('Error fetching budget:', error);
                toast({
                    title: 'Error',
                    description: 'Error al cargar el presupuesto.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        }

        fetchBudget();
    }, [currentStudio, budgetId, router, toast]);

    if (loading) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    if (!budget) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold">Presupuesto no encontrado</h1>
                <p className="text-muted-foreground">El presupuesto que buscas no existe o no tienes permisos para verlo.</p>
                <Button onClick={() => router.push('/budgets')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Presupuestos
                </Button>
            </div>
        );
    }

    // Preparar datos para el PDF
    const budgetPDFData = {
        eventType: budget.eventInfo.type,
        eventDate: budget.eventInfo.date,
        eventLocation: budget.eventInfo.location,
        services: budget.items,
        servicesTotal: budget.summary.subtotal,
        logisticsCost: budget.summary.logistics,
        totalUSD: budget.summary.totalUSD,
        totalARS: budget.summary.totalARS,
        usdRate: budget.summary.exchangeRate,
    };

    const pdfFileName = `Presupuesto-${budget.eventInfo.type}-${budget.clientName}.pdf`;

    return (
        <div className="space-y-6">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => router.push('/budgets')}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Presupuestos
                </Button>
                
                <div className="flex gap-2">
                    <BudgetDownloadButton 
                        data={budgetPDFData} 
                        fileName={pdfFileName}
                    />
                    
                    <Button
                        onClick={() => router.push(`/budgets?edit=${budgetId}`)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Presupuesto
                    </Button>
                </div>
            </div>

            {/* Budget Summary */}
            <BudgetSummary budget={budget} />
        </div>
    );
}

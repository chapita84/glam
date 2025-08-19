
'use client';

import React, { useState, useEffect } from 'react';
import { BudgetWizard } from '@/components/budget-wizard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getBudgets, deleteBudget } from '@/lib/firebase/firestore';
import { type Budget } from '@/lib/types';


const statusMap: {
  [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
} = {
  draft: { label: 'Borrador', variant: 'secondary' },
  sent: { label: 'Enviado', variant: 'outline' },
  approved: { label: 'Confirmado', variant: 'default' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
};

export default function BudgetsPageClient() {
  const { currentStudio, profile } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { toast } = useToast();

  const refreshData = async () => {
    if (!currentStudio) return;
    setLoading(true);
    try {
      const fetchedBudgets = await getBudgets(currentStudio.id);
      setBudgets(fetchedBudgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los presupuestos.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentStudio) {
      refreshData();
    } else {
      setLoading(false);
    }
  }, [currentStudio]);

  const handleOpenDialog = (budget: Budget | null) => {
    setEditingBudget(budget);
    setOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!currentStudio) {
      toast({
        title: 'Error',
        description: 'No se ha podido identificar el estudio.',
        variant: 'destructive',
      });
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      try {
        await deleteBudget(currentStudio.id, budgetId);
        await refreshData();
        toast({ title: 'Presupuesto Eliminado' });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el presupuesto.',
          variant: 'destructive',
        });
      }
    }
  };
  
    if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }
  
  if (!currentStudio) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <p className="text-muted-foreground">
          {profile?.globalRole === 'superAdmin'
            ? 'Selecciona un estudio para empezar a gestionarlo.'
            : 'No tienes un estudio asignado. Contacta al administrador.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setEditingBudget(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}
              </DialogTitle>
              <DialogDescription>
                Utiliza el asistente para generar, personalizar y gestionar un
                presupuesto para un evento.
              </DialogDescription>
            </DialogHeader>
            <BudgetWizard
              studioId={currentStudio.id}
              initialBudget={editingBudget}
              onSave={() => {
                setOpen(false);
                setEditingBudget(null);
                refreshData();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Presupuestos</CardTitle>
          <CardDescription>
            Revisa y gestiona todos los presupuestos que has creado en {currentStudio.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Evento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total (USD)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.length > 0 ? (
                budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      {budget.budgetName}
                    </TableCell>
                    <TableCell>{budget.clientName}</TableCell>
                    <TableCell>
                      {new Date(budget.eventInfo.date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                    </TableCell>
                    <TableCell>${budget.summary.totalUSD.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusMap[budget.status || 'draft']?.variant || 'secondary'
                        }
                      >
                        {statusMap[budget.status || 'draft']?.label ||
                          'Desconocido'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenDialog(budget)}
                          >
                            Ver / Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(budget.id!)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No hay presupuestos creados en este estudio.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

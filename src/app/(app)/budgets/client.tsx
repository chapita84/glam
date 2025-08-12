
'use client';

import React, { useState } from "react";
import { BudgetWizard } from "@/components/budget-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import { type Budget, deleteBudget } from "@/lib/firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStudioData } from "@/contexts/StudioDataContext";
import { useToast } from "@/hooks/use-toast";

const statusMap: { [key: string]: { label: string, variant: "default" | "secondary" | "destructive" | "outline" } } = {
    draft: { label: "Borrador", variant: "secondary" },
    sent: { label: "Enviado", variant: "outline" },
    approved: { label: "Confirmado", variant: "default" },
    rejected: { label: "Rechazado", variant: "destructive" },
};

export default function BudgetsPageClient() {
    const { budgets, studioId, refreshData, loading } = useStudioData();
    const [open, setOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const { toast } = useToast();

    const handleOpenDialog = (budget: Budget | null) => {
        setEditingBudget(budget);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!studioId) {
            toast({ title: "Error", description: "No se ha podido identificar el estudio.", variant: "destructive"});
            return;
        }
        if (confirm("¿Estás seguro de que quieres eliminar este presupuesto?")) {
            try {
                await deleteBudget(studioId, id);
                await refreshData();
                toast({ title: "Presupuesto Eliminado" });
            } catch (error) {
                toast({ title: "Error", description: "No se pudo eliminar el presupuesto.", variant: "destructive"});
            }
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
                    <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Crear Presupuesto</Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Presupuestos</CardTitle>
                        <CardDescription>Revisa y gestiona todos los presupuestos que has creado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="ml-4 text-muted-foreground">Cargando presupuestos...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
                 <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setEditingBudget(null); }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Presupuesto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{editingBudget ? "Editar Presupuesto" : "Crear Nuevo Presupuesto"}</DialogTitle>
                            <DialogDescription>
                                Utiliza el asistente para generar, personalizar y gestionar un presupuesto para un evento.
                            </DialogDescription>
                        </DialogHeader>
                        <BudgetWizard 
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
                        Revisa y gestiona todos los presupuestos que has creado.
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
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {budgets.map(budget => (
                                <TableRow key={budget.id}>
                                    <TableCell className="font-medium">{budget.budgetName}</TableCell>
                                    <TableCell>{budget.clientName}</TableCell>
                                    <TableCell>{new Date(budget.eventInfo.date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</TableCell>
                                    <TableCell>${budget.summary.totalUSD.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusMap[budget.status]?.variant || "secondary"}>
                                            {statusMap[budget.status]?.label || "Desconocido"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Menú</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(budget)}>Ver / Editar</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(budget.id!)}>Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

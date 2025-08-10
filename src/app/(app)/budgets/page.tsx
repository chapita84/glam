
'use client';

import React, { useState } from "react"
import { BudgetWizard } from "@/components/budget-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { type Budget, deleteBudget, type Service } from "@/lib/firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface BudgetsPageProps {
  budgets: Budget[];
  services: Service[]; // Pass services to be used as templates
  tenantId: string;
  refreshData: () => void;
  loading: boolean;
}

const statusMap: { [key: string]: { label: string, variant: "default" | "secondary" | "destructive" | "outline" } } = {
    draft: { label: "Borrador", variant: "secondary" },
    sent: { label: "Enviado", variant: "outline" },
    approved: { label: "Confirmado", variant: "default" },
    rejected: { label: "Rechazado", variant: "destructive" },
}


export default function BudgetsPage({ budgets = [], services = [], tenantId, refreshData, loading }: BudgetsPageProps) {
    const [open, setOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    const handleOpenDialog = (budget: Budget | null) => {
        setEditingBudget(budget);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que quieres eliminar este presupuesto?")) {
            await deleteBudget(tenantId, id);
            refreshData();
        }
    }

    if (loading) {
        return <p>Cargando presupuestos...</p>
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
                            tenantId={tenantId} 
                            initialBudget={editingBudget}
                            serviceTemplates={services}
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

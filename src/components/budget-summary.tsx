'use client';

import { type Budget } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Clock, User, DollarSign, FileText, History } from 'lucide-react';
import { Wand2, Send, CheckCircle, XCircle } from 'lucide-react';

const statusOptions = [
    { value: 'draft', label: 'Borrador', icon: Wand2, variant: 'secondary' as const },
    { value: 'sent', label: 'Enviado', icon: Send, variant: 'outline' as const },
    { value: 'approved', label: 'Confirmado', icon: CheckCircle, variant: 'default' as const },
    { value: 'rejected', label: 'Rechazado', icon: XCircle, variant: 'destructive' as const },
    { value: 'canceled', label: 'Cancelado', icon: XCircle, variant: 'destructive' as const },
];

interface BudgetSummaryProps {
    budget: Budget;
}

export function BudgetSummary({ budget }: BudgetSummaryProps) {
    const currentStatus = statusOptions.find(s => s.value === budget.status);
    const StatusIcon = currentStatus?.icon || FileText;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{budget.budgetName}</h1>
                    <p className="text-muted-foreground">Cliente: {budget.clientName}</p>
                </div>
                <Badge variant={currentStatus?.variant || 'secondary'} className="text-sm px-3 py-1">
                    <StatusIcon className="h-4 w-4 mr-2" />
                    {currentStatus?.label || budget.status}
                </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Información del Evento */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Información del Evento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Tipo:</span>
                            <span className="font-medium">{budget.eventInfo.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Fecha:</span>
                            <span className="font-medium">
                                {new Date(budget.eventInfo.date).toLocaleDateString('es-AR')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Hora:</span>
                            <span className="font-medium">{budget.eventInfo.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Ubicación:</span>
                            <span className="font-medium">{budget.eventInfo.location}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Resumen Financiero */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Resumen Financiero
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal Servicios:</span>
                            <span className="font-medium">${budget.summary.subtotal.toFixed(2)} USD</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Logística:</span>
                            <span className="font-medium">${budget.summary.logistics.toFixed(2)} USD</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-semibold">
                            <span>Total USD:</span>
                            <span>${budget.summary.totalUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Tasa de cambio:</span>
                            <span>${budget.summary.exchangeRate.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold text-primary">
                            <span>Total ARS:</span>
                            <span>${budget.summary.totalARS.toLocaleString('es-AR')}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Servicios/Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Servicios Incluidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Servicio</TableHead>
                                <TableHead className="text-center">Cantidad</TableHead>
                                <TableHead className="text-center">Duración (min)</TableHead>
                                <TableHead className="text-right">Precio Unit.</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {budget.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{item.description}</div>
                                            <div className="text-sm text-muted-foreground">{item.category}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-center">{item.duration || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        ${item.unitCost.amount.toFixed(2)} {item.unitCost.currency}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${(item.quantity * item.unitCost.amount).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Historial de Estados */}
            {budget.statusHistory && budget.statusHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Historial de Estados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {budget.statusHistory.map((historyEntry, index) => {
                                const statusLabel = statusOptions.find(s => s.value === historyEntry.status)?.label || historyEntry.status;
                                const StatusIcon = statusOptions.find(s => s.value === historyEntry.status)?.icon || FileText;
                                
                                // Convertir timestamp de Firestore a Date
                                let timestamp: Date;
                                if (historyEntry.timestamp?.toDate) {
                                    // Es un Firestore Timestamp
                                    timestamp = historyEntry.timestamp.toDate();
                                } else if (historyEntry.timestamp instanceof Date) {
                                    // Ya es un Date
                                    timestamp = historyEntry.timestamp;
                                } else if (typeof historyEntry.timestamp === 'string') {
                                    // Es un string
                                    timestamp = new Date(historyEntry.timestamp);
                                } else {
                                    // Fallback
                                    timestamp = new Date();
                                }
                                
                                return (
                                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-background rounded-full">
                                                <StatusIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{statusLabel}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        por {historyEntry.userName || historyEntry.userEmail || 'Usuario desconocido'}
                                                    </span>
                                                </div>
                                                {historyEntry.notes && (
                                                    <p className="text-sm text-muted-foreground mt-1">{historyEntry.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            <div className="font-medium">{timestamp.toLocaleDateString('es-AR')}</div>
                                            <div>{timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

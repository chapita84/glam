
'use client'

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { type TimeBlock } from "@/lib/firebase/firestore";
import { format, parse, startOfDay, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BlockFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (blockData: Omit<TimeBlock, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
    onDelete: (blockId: string) => Promise<void>;
    block: Partial<TimeBlock> | null;
    isSaving: boolean;
    canDelete?: boolean;
}

export function BlockForm({ isOpen, onClose, onSave, onDelete, block, isSaving, canDelete }: BlockFormProps) {
    const [reason, setReason] = useState('');
    const [isAllDay, setIsAllDay] = useState(false);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState(format(new Date(), 'HH:mm'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endTime, setEndTime] = useState(format(new Date(), 'HH:mm'));
    const { toast } = useToast();

    useEffect(() => {
        if (block) {
            setReason(block.reason || '');
            setIsAllDay(block.isAllDay || false);
            setStartDate(format(block.startTime || new Date(), 'yyyy-MM-dd'));
            setStartTime(format(block.startTime || new Date(), 'HH:mm'));
            setEndDate(format(block.endTime || new Date(), 'yyyy-MM-dd'));
            setEndTime(format(block.endTime || new Date(), 'HH:mm'));
        } else {
            setReason('');
            setIsAllDay(false);
            const now = new Date();
            setStartDate(format(now, 'yyyy-MM-dd'));
            setStartTime(format(now, 'HH:mm'));
            setEndDate(format(now, 'yyyy-MM-dd'));
            setEndTime(format(now, 'HH:mm'));
        }
    }, [block]);

    const handleSave = () => {
        if (!reason) {
            toast({ title: "Error", description: "La razón del bloqueo es obligatoria.", variant: "destructive" });
            return;
        }

        let finalStartTime = parse(`${startDate} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        let finalEndTime = parse(`${endDate} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

        if (isAllDay) {
            finalStartTime = startOfDay(parse(startDate, 'yyyy-MM-dd', new Date()));
            finalEndTime = endOfDay(parse(endDate, 'yyyy-MM-dd', new Date()));
        }

        const blockData: Omit<TimeBlock, 'id' | 'createdAt'> & { id?: string } = {
            id: block?.id,
            startTime: finalStartTime,
            endTime: finalEndTime,
            isAllDay,
            reason
        };
        onSave(blockData);
    };

    const handleConfirmDelete = () => {
        if (!block?.id) return;
        onDelete(block.id);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{block?.id ? 'Editar Bloqueo' : 'Crear Bloqueo de Agenda'}</DialogTitle>
                    <DialogDescription>Define un período de tiempo en el que no se podrán agendar citas.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Razón del bloqueo</Label>
                        <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Vacaciones, Evento Privado" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="isAllDay" checked={isAllDay} onCheckedChange={(checked) => setIsAllDay(!!checked)} />
                        <Label htmlFor="isAllDay">Todo el día</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Desde</Label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            {!isAllDay && <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />}
                        </div>
                        <div className="space-y-2">
                            <Label>Hasta</Label>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            {!isAllDay && <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />}
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex justify-between w-full">
                    <div>
                        {block?.id && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isSaving}><Trash2 className="mr-2 h-4 w-4"/>Eliminar</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro de que quieres eliminar este bloqueo?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el bloqueo de la agenda.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isSaving}>
                                             {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Continuar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Guardar Bloqueo
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

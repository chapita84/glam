
"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Lock } from "lucide-react"
import { format, startOfWeek, endOfWeek, parse } from "date-fns"
import { 
    addOrUpdateAppointment, 
    deleteAppointment, 
    getTimeBlocks, 
    addOrUpdateTimeBlock, 
    deleteTimeBlock,
    getServicesForStudio,
    getStaffForStudio,
    getAppointments
} from "@/lib/firebase/firestore"
import { type Appointment, type TimeBlock, type Service, type UserProfile } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import AppointmentsFullCalendar from "./appointments-full-calendar"
import { type EventInput, type EventDropArg } from "@fullcalendar/core"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { BlockForm } from "./appointments-block-form"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"

type StaffMemberWithRole = UserProfile & { roleId: string };

export function AppointmentsCalendar() {
  const { currentStudio, currentStudioRole } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [staff, setStaff] = useState<StaffMemberWithRole[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Partial<TimeBlock> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewRange, setViewRange] = useState({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) });
  
  const popoverAnchorRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  
  const canBlockAgenda = currentStudioRole?.permissions.includes('appointments:block');
  const canDeleteBlock = currentStudioRole?.permissions.includes('appointments:delete');

  const refreshData = useCallback(async () => {
    if (!currentStudio) return;
    setLoading(true);
    try {
        const [appts, blocks, staffList, serviceList] = await Promise.all([
            getAppointments(currentStudio.id, viewRange.start, viewRange.end),
            getTimeBlocks(currentStudio.id, viewRange.start, viewRange.end),
            getStaffForStudio(currentStudio.id),
            getServicesForStudio(currentStudio.id)
        ]);
        setAppointments(appts);
        setTimeBlocks(blocks);
        setStaff(staffList);
        setServices(serviceList);
    } catch (error) {
        console.error("Error refreshing calendar data:", error);
        toast({ title: "Error", description: "No se pudieron cargar los datos del calendario.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [currentStudio, viewRange.start, viewRange.end, toast]);

  useEffect(() => {
    if (currentStudio) {
        refreshData();
    } else {
        setLoading(false);
    }
  }, [currentStudio, refreshData]);

  const events: EventInput[] = useMemo(() => {
    const appointmentEvents = appointments.map(appt => ({
      id: appt.id,
      title: `${appt.serviceName} - ${appt.clientName}`,
      start: appt.start,
      end: appt.end,
      allDay: false,
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6'
    }));

    const timeBlockEvents = timeBlocks.map(block => ({
      id: `block-${block.id}`,
      title: block.reason,
      start: block.start,
      end: block.end,
      allDay: block.isAllDay,
      backgroundColor: '#ef4444', 
      borderColor: '#ef4444'
    }));

    return [...appointmentEvents, ...timeBlockEvents];
  }, [appointments, timeBlocks]);
  
  const updatePopoverPosition = (element: HTMLElement) => {
    if (popoverAnchorRef.current) {
        const rect = element.getBoundingClientRect();
        popoverAnchorRef.current.style.position = 'fixed';
        popoverAnchorRef.current.style.top = `${rect.top}px`;
        popoverAnchorRef.current.style.left = `${rect.right + 8}px`;
    }
  };

  const handleDateClick = (arg: any) => {
    setSelectedAppointment(null);
    setSelectedDate(arg.date);
    updatePopoverPosition(arg.jsEvent.target);
    setIsPopoverOpen(true);
  };

  const handleEventClick = (arg: any) => {
    const id = arg.event.id;
    if (id.startsWith('block-')) {
        const block = timeBlocks.find(b => b.id === id.replace('block-', ''));
        if(block) {
            setSelectedBlock(block);
            setIsBlockModalOpen(true);
        }
    } else {
        const appt = appointments.find(a => a.id === id);
        if (appt) {
            setSelectedAppointment(appt);
            setSelectedDate(appt.start);
            updatePopoverPosition(arg.el);
            setIsPopoverOpen(true);
        }
    }
  };
  
    const handleEventDrop = useCallback(async (arg: EventDropArg) => {
        // Implementation remains the same
    }, [currentStudio, appointments, timeBlocks, refreshData, toast]);

    const handleSaveAppointment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentStudio) return;

        setIsSaving(true);
        const formData = new FormData(event.currentTarget);
        const serviceId = formData.get('serviceId') as string;
        const staffId = formData.get('staffId') as string;
        const date = formData.get('date') as string;
        const time = formData.get('time') as string;
        
        const service = services.find(s => s.id === serviceId);
        if (!service) {
            toast({ title: "Error", description: "Servicio no válido.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        const start = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
        const end = new Date(start.getTime() + service.duration * 60000);
        
        const apptData: Omit<Appointment, 'id'> & { id?: string } = {
            id: selectedAppointment?.id,
            clientName: formData.get('clientName') as string,
            serviceId,
            staffId,
            start,
            end,
            clientId: 'anonymous', // Placeholder
            serviceName: service.name,
            staffName: staff.find(s => s.uid === staffId)?.displayName || 'N/A'
        };
        
        try {
            await addOrUpdateAppointment(currentStudio.id, apptData);
            await refreshData();
            setIsPopoverOpen(false);
            toast({ title: "Cita guardada con éxito" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar la cita.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAppointment = async () => {
        if (!currentStudio || !selectedAppointment) return;
        
        setIsSaving(true);
        try {
            await deleteAppointment(currentStudio.id, selectedAppointment.id);
            await refreshData();
            setIsPopoverOpen(false);
            toast({ title: "Cita eliminada" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar la cita.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBlock = useCallback(async (blockData: Omit<TimeBlock, 'id' | 'createdAt'> & { id?: string }) => {
        if (!currentStudio) {
            toast({ title: "Error", description: "ID del estudio no encontrado.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const dataToSave = { ...blockData, id: selectedBlock?.id };
            await addOrUpdateTimeBlock(currentStudio.id, dataToSave);
            await refreshData();
            setIsBlockModalOpen(false);
            toast({ title: "Éxito", description: "El bloqueo se ha guardado correctamente." });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el bloqueo.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [currentStudio, refreshData, toast, selectedBlock]);

    const handleDeleteBlock = useCallback(async (blockId: string) => {
        if (!currentStudio) return;
        if (confirm('¿Estás seguro de que quieres eliminar este bloqueo?')) {
            setIsSaving(true);
            try {
                await deleteTimeBlock(currentStudio.id, blockId);
                await refreshData();
                setIsBlockModalOpen(false);
                toast({ title: "Bloqueo Eliminado" });
            } catch (e) {
                toast({ title: "Error", description: "No se pudo eliminar el bloqueo.", variant: "destructive" });
            } finally {
                setIsSaving(false);
            }
        }
    }, [currentStudio, refreshData, toast]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  if (!currentStudio) {
    return <div className="text-center p-8">Selecciona un estudio para ver el calendario.</div>
  }

  const BookingForm = () => (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverAnchor ref={popoverAnchorRef} />
        <PopoverContent className="w-96 p-0" side="right" align="start">
            <form onSubmit={handleSaveAppointment}>
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{selectedAppointment ? "Editar Cita" : "Crear Nueva Cita"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 p-4">
                    <Input name="clientName" placeholder="Nombre del Cliente" defaultValue={selectedAppointment?.clientName} required />
                    <Select name="serviceId" defaultValue={selectedAppointment?.serviceId} required>
                        <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
                        <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select name="staffId" defaultValue={selectedAppointment?.staffId} required>
                        <SelectTrigger><SelectValue placeholder="Selecciona un miembro" /></SelectTrigger>
                        <SelectContent>{staff.map(m => <SelectItem key={m.uid} value={m.uid}>{m.displayName}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="date" type="date" defaultValue={format(selectedDate || new Date(), 'yyyy-MM-dd')} required />
                        <Input name="time" type="time" defaultValue={format(selectedDate || new Date(), 'HH:mm')} required />
                    </div>
                </div>
                <DialogFooter className="justify-between bg-muted p-4 rounded-b-lg">
                   {selectedAppointment && (
                      <AlertDialog>
                          <AlertDialogTrigger asChild><Button type="button" variant="destructive" size="icon" disabled={isSaving}><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteAppointment} disabled={isSaving}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  )}
                  <Button type="submit" disabled={isSaving} className="ml-auto">{isSaving ? <Loader2 className="animate-spin" /> : 'Guardar'}</Button>
                </DialogFooter>
            </form>
        </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex h-full w-full bg-card rounded-xl border overflow-hidden p-4 relative">
        <div ref={popoverAnchorRef} style={{ position: 'fixed', zIndex: 1000 }} />
        <div className="absolute top-6 right-6 z-30 flex gap-2">
            {canBlockAgenda && (
            <Button variant="outline" onClick={() => { setSelectedBlock(null); setIsBlockModalOpen(true);}}>
                <Lock className="mr-2 h-4 w-4"/>Bloquear Horario
            </Button>
            )}
        </div>
        <AppointmentsFullCalendar 
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onDatesSet={(dateInfo) => {
                setViewRange({ start: dateInfo.start, end: dateInfo.end });
            }}
            onEventDrop={handleEventDrop}
        />
        <BookingForm />
         <BlockForm 
            isOpen={isBlockModalOpen}
            onClose={() => setIsBlockModalOpen(false)}
            onSave={handleSaveBlock}
            onDelete={handleDeleteBlock}
            block={selectedBlock}
            isSaving={isSaving}
            canDelete={canDeleteBlock}
        />
    </div>
  )
}

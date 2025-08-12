
"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Lock } from "lucide-react"
import { format, parse, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { type Booking, addOrUpdateBooking, deleteBooking, type TimeBlock, getTimeBlocks, addOrUpdateTimeBlock, deleteTimeBlock } from "@/lib/firebase/firestore"
import { useStudioData } from "@/contexts/StudioDataContext"
import { useToast } from "@/hooks/use-toast"
import AppointmentsFullCalendar from "./appointments-full-calendar"
import { type EventInput, type EventDropArg } from "@fullcalendar/core"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { BlockForm } from "./appointments-block-form"
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover"

export function AppointmentsCalendar() {
  const { bookings, staff, services, studioId, refreshData, currentUser, config } = useStudioData();
  const [isSaving, setIsSaving] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Partial<TimeBlock> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [viewRange, setViewRange] = useState({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) });
  const virtualRef = useRef({
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => "",
    }),
  });

  const { toast } = useToast();
  
  const canBlockAgenda = currentUser?.role?.permissions.has('agenda_block');
  const canDeleteBlock = currentUser?.role?.permissions.has('agenda_block_delete');

  useEffect(() => {
    const fetchTimeBlocks = async () => {
        if (studioId) {
            const blocks = await getTimeBlocks(studioId, viewRange.start, viewRange.end);
            setTimeBlocks(blocks);
        }
    };
    fetchTimeBlocks();
  }, [studioId, viewRange, refreshData]);

  const events: EventInput[] = useMemo(() => {
    const bookingEvents = bookings.map(booking => ({
      id: booking.id,
      title: `${booking.serviceName} - ${booking.clientName}`,
      start: booking.startTime,
      end: new Date(booking.startTime.getTime() + booking.duration * 60000),
      allDay: false,
      classNames: ['z-20', 'border-l-4', 'border-primary-500'],
      backgroundColor: '#3b82f620',
      textColor: '#bfdbfe',
      borderColor: '#3b82f6'
    }));

    const timeBlockEvents = timeBlocks.map(block => ({
      id: `block-${block.id}`,
      title: block.reason,
      start: block.startTime,
      end: block.endTime,
      allDay: block.isAllDay,
      backgroundColor: '#ef4444', 
      classNames: ['z-20', 'border-l-4', 'border-red-500'],
      textColor: '#fecaca', 
      borderColor: '#ef4444'
    }));

    const workingHours = config?.workingHours || [];
    const nonWorkingEvents: EventInput[] = [];

    const weekDays = eachDayOfInterval({ start: viewRange.start, end: viewRange.end });

    weekDays.forEach(day => {
        const dayOfWeek = day.getDay();
        const workingDay = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

        if (!workingDay || !workingDay.enabled) {
            nonWorkingEvents.push({
                id: `non-working-fullday-${day.toISOString()}`,
                start: startOfDay(day),
                end: endOfDay(day),
                display: 'background',
                backgroundColor: '#6b7280', // Gray for non-working days
                classNames: ['opacity-25', 'z-10']
            });
        } else {
            const workStart = parse(workingDay.startTime, 'HH:mm', day);
            const workEnd = parse(workingDay.endTime, 'HH:mm', day);
            
            nonWorkingEvents.push({
                id: `non-working-before-${day.toISOString()}`,
                start: startOfDay(day),
                end: workStart,
                display: 'background',
                backgroundColor: '#6b7280',
                classNames: ['opacity-25', 'z-10']
            });
            nonWorkingEvents.push({
                id: `non-working-after-${day.toISOString()}`,
                start: workEnd,
                end: endOfDay(day),
                display: 'background',
                backgroundColor: '#6b7280',
                classNames: ['opacity-25', 'z-10']
            });
        }
    });

    return [...bookingEvents, ...timeBlockEvents, ...nonWorkingEvents];
  }, [bookings, timeBlocks, config, viewRange]);

  const updateVirtualRef = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    virtualRef.current.getBoundingClientRect = () => rect;
  }

  const handleDateClick = (arg: any) => {
    const clickedTime = arg.date.getTime();
    const isBlocked = events.some(event => 
        event.start && event.end &&
        clickedTime >= (event.start as Date).getTime() &&
        clickedTime < (event.end as Date).getTime()
    );

    if (isBlocked) {
        toast({ title: "Horario no disponible", description: "No puedes crear una cita en un horario bloqueado o fuera del horario laboral.", variant: "destructive"});
        return;
    }

    setSelectedBooking(null);
    setSelectedDate(arg.date);
    updateVirtualRef(arg.jsEvent.target)
    setIsPopoverOpen(true);
  };

  const handleEventClick = (arg: any) => {
    if (arg.event.id.startsWith('block-')) {
        const blockId = arg.event.id.replace('block-', '');
        const block = timeBlocks.find(b => b.id === blockId);
        if(block) {
            openBlockModal(block);
        }
        return;
    }
    const bookingId = arg.event.id;
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setSelectedDate(booking.startTime);
      updateVirtualRef(arg.el);
      setIsPopoverOpen(true);
    }
  };

  const handleSaveBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studioId) {
        toast({ title: "Error", description: "El ID del estudio no se encontró.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    const startTime = new Date(year, month - 1, day, hours, minutes);

    const serviceId = formData.get('serviceId') as string;
    const selectedService = services.find(s => s.id === serviceId);

    const staffId = formData.get('staffId') as string;
    const selectedStaff = staff.find(s => s.id === staffId);

    try {
        if (!selectedService || !selectedStaff) {
            throw new Error("El servicio o el miembro del personal seleccionado no es válido.");
        }

        const bookingData: Omit<Booking, 'id' | 'createdAt' | 'endTime'> & { id?: string } = {
            id: selectedBooking?.id,
            clientName: formData.get('clientName') as string,
            clientId: 'temp-client-id', // Placeholder
            staffId: selectedStaff.id,
            staffName: selectedStaff.name,
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            duration: selectedService.duration,
            startTime: startTime,
            status: 'confirmed',
            price: { amount: selectedService.price, currency: 'USD' },
            notes: formData.get('notes') as string,
        };

        await addOrUpdateBooking(studioId, bookingData);

        setIsPopoverOpen(false);
        await refreshData();
        toast({ title: "Cita Guardada", description: "La cita se ha guardado en el calendario." });
    } catch (error: any) {
        toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteBooking = async () => {
    if (!studioId || !selectedBooking?.id) {
         toast({ title: "Error", description: "No se pudo eliminar la cita.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        await deleteBooking(studioId, selectedBooking.id);
        setIsPopoverOpen(false);
        await refreshData();
        toast({ title: "Cita Eliminada", description: "La cita se ha eliminado del calendario." });
    } catch(error: any) {
        toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  const openBlockModal = (block: Partial<TimeBlock> | null) => {
    setSelectedBlock(block);
    setIsBlockModalOpen(true);
  }

  const handleSaveBlock = useCallback(async (blockData: Omit<TimeBlock, 'id' | 'createdAt'> & { id?: string }) => {
    if (!studioId) {
        toast({ title: "Error", description: "ID del estudio no encontrado.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        await addOrUpdateTimeBlock(studioId, blockData);
        await refreshData();
        toast({ title: "Éxito", description: "El bloqueo se ha guardado correctamente." });
        setIsBlockModalOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "No se pudo guardar el bloqueo.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }, [studioId, refreshData, toast]);

  const handleDeleteBlock = useCallback(async (blockId: string) => {
    if (!studioId) {
        toast({ title: "Error", description: "No se pudo eliminar el bloqueo.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        await deleteTimeBlock(studioId, blockId);
        await refreshData();
        toast({ title: "Bloqueo Eliminado" });
        setIsBlockModalOpen(false);
    } catch (e) {
        toast({ title: "Error", description: "No se pudo eliminar el bloqueo.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }, [studioId, refreshData, toast]);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const { event } = arg;
    const isBlock = event.id.startsWith('block-');
    
    if (!studioId || !event.start) {
        toast({ title: "Error", description: "No se pudo mover el evento.", variant: "destructive" });
        arg.revert();
        return;
    }

    setIsSaving(true);
    try {
      if (isBlock) {
        const blockId = event.id.replace('block-', '');
        const originalBlock = timeBlocks.find(b => b.id === blockId);
        if (originalBlock && event.start && event.end) {
            const updatedBlock = { ...originalBlock, startTime: event.start, endTime: event.end };
            await addOrUpdateTimeBlock(studioId, updatedBlock);
        } else {
            throw new Error("No se encontró el bloqueo original o las fechas son inválidas.")
        }
      } else {
        const bookingId = event.id;
        const originalBooking = bookings.find(b => b.id === bookingId);
        if (originalBooking && event.start) {
            const updatedBooking = { ...originalBooking, startTime: event.start };
            await addOrUpdateBooking(studioId, updatedBooking);
        } else {
            throw new Error("No se encontró la cita original o la fecha es inválida.")
        }
      }
      await refreshData();
      toast({ title: "Evento Actualizado", description: "El evento se ha movido correctamente." });
    } catch (error) {
      toast({ title: "Error al Mover", description: "No se pudo actualizar el evento.", variant: "destructive" });
      arg.revert();
    } finally {
      setIsSaving(false);
    }
  }, [studioId, bookings, timeBlocks, refreshData, toast]);

  const BookingForm = () => {
    const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(selectedBooking?.serviceId);
    const selectedService = services.find(s => s.id === selectedServiceId);
    const initialDate = selectedBooking?.startTime || selectedDate || new Date();
    
    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverAnchor virtualRef={virtualRef} />
            <PopoverContent className="w-96 p-0" side="right" align="start">
                <form onSubmit={handleSaveBooking}>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold leading-none tracking-tight">{selectedBooking ? "Editar Cita" : "Crear Nueva Cita"}</h3>
                    </div>
                    <div className="grid gap-4 p-4">
                        <Input id="clientName" name="clientName" placeholder="Nombre del Cliente" defaultValue={selectedBooking?.clientName} required />
                        <Select name="serviceId" onValueChange={setSelectedServiceId} defaultValue={selectedBooking?.serviceId} required>
                            <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
                            <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select name="staffId" defaultValue={selectedBooking?.staffId} required>
                            <SelectTrigger><SelectValue placeholder="Selecciona un miembro" /></SelectTrigger>
                            <SelectContent>{staff.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-4">
                            <Input id="date" name="date" type="date" defaultValue={format(initialDate, 'yyyy-MM-dd')} required />
                            <Input id="time" name="time" type="time" defaultValue={format(initialDate, 'HH:mm')} required />
                        </div>
                        {selectedService && <div className="text-sm text-muted-foreground"><p>Duración: {selectedService.duration} min. Precio: ${selectedService.price.toFixed(2)}</p></div>}
                        <Input id="notes" name="notes" placeholder="Notas adicionales (opcional)" defaultValue={selectedBooking?.notes}/>
                    </div>
                    <div className="flex justify-between w-full bg-muted p-4 rounded-b-lg">
                       {selectedBooking && (
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button type="button" variant="destructive" size="sm" disabled={isSaving}>
                                      <Trash2 />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta cita?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Esta acción no se puede deshacer. Esto eliminará permanentemente la cita.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDeleteBooking} disabled={isSaving}>
                                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                          Continuar
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      )}
                      <Button type="submit" disabled={isSaving} className="ml-auto" size="sm">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Guardar
                      </Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    )
  }

  return (
    <div className="flex h-full w-full bg-card rounded-xl border overflow-hidden p-4 relative">
      <div className="absolute top-6 right-6 z-30 flex gap-2">
        {canBlockAgenda && (
          <Button variant="outline" onClick={() => openBlockModal(null)}>
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

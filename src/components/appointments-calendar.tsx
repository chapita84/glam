"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Lock, RefreshCw } from "lucide-react"
import { format, startOfWeek, endOfWeek, parse } from "date-fns"
import { 
    addOrUpdateAppointment, 
    deleteAppointment, 
    getTimeBlocks, 
    addOrUpdateTimeBlock, 
    deleteTimeBlock,
    getServicesForStudio,
    getStaffForStudio,
    getAppointments,
    getStudioConfig,
    getStudioClients
} from "@/lib/firebase/firestore"
import { type Appointment, type TimeBlock, type Service, type UserProfile } from "@/lib/types";
import { StudioConfig } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import AppointmentsFullCalendar, { type CalendarRef } from "./appointments-full-calendar"
import { type EventInput, type EventDropArg } from "@fullcalendar/core"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { BlockForm } from "./appointments-block-form"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"

type StaffMemberWithRole = UserProfile & { roleId: string };

export function AppointmentsCalendar() {
  const { currentStudio, currentStudioRole, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Create a stable toast function to prevent infinite loops
  const showToast = useCallback((message: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    toast(message);
  }, [toast]);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [staff, setStaff] = useState<StaffMemberWithRole[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [studioConfig, setStudioConfig] = useState<StudioConfig | null>(null);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed currentView state - let FullCalendar handle this naturally

  const [isSaving, setIsSaving] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Partial<TimeBlock> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const calendarRef = useRef<CalendarRef>(null);
  
  // Memoize initial view range to prevent recreating dates on each render
  const initialViewRange = useMemo(() => {
    const now = new Date();
    return { start: startOfWeek(now), end: endOfWeek(now) };
  }, []);
  
  // Create a much wider initial data range to avoid reloads during navigation
  const initialDataRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    
    // Expand to cover 3 months before and after current date
    start.setMonth(start.getMonth() - 3);
    start.setDate(1); // Start of month
    
    end.setMonth(end.getMonth() + 3);
    end.setMonth(end.getMonth() + 1, 0); // Last day of the month
    
    console.log('📅 Initial data range:', { start, end });
    return { start, end };
  }, []);
  
  const [viewRange, setViewRange] = useState(initialViewRange);
  const [dataRange, setDataRange] = useState(initialDataRange); // Separate range for data loading
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>("");
  const [customClientName, setCustomClientName] = useState<string>("");
  
  const popoverAnchorRef = useRef<HTMLDivElement>(null);
  
  const isSuperAdmin = profile?.globalRole === 'superAdmin';
  const isOwner = profile?.globalRole === 'owner';
  const canBlockAgenda = isSuperAdmin || isOwner || currentStudioRole?.permissions.includes('appointments:block');
  const canDeleteBlock = isSuperAdmin || isOwner || currentStudioRole?.permissions.includes('appointments:delete');

  // Add debounce to prevent excessive calls - REMOVED, causing issues
  
  // Memoize the view range values to prevent unnecessary re-renders
  const viewRangeKey = useMemo(() => 
    `${dataRange.start.getTime()}-${dataRange.end.getTime()}`, 
    [dataRange.start, dataRange.end]
  );

  // Separate data loading from date changes to prevent loops
  const loadAppointmentData = useCallback(async () => {
    if (!currentStudio) return;
    
    try {
      const [appts, blocks] = await Promise.all([
        getAppointments(currentStudio.id, dataRange.start, dataRange.end),
        getTimeBlocks(currentStudio.id, dataRange.start, dataRange.end)
      ]);
      setAppointments(appts);
      setTimeBlocks(blocks);
    } catch (error) {
      console.error("Error loading appointment data:", error);
    }
  }, [currentStudio?.id, viewRangeKey]);

  const loadStaticData = useCallback(async () => {
    if (!currentStudio) return;
    
    try {
      const [staffList, serviceList, config, clientList] = await Promise.all([
        getStaffForStudio(currentStudio.id),
        getServicesForStudio(currentStudio.id),
        getStudioConfig(currentStudio.id),
        getStudioClients(currentStudio.id)
      ]);
      setStaff(staffList);
      setServices(serviceList);
      setStudioConfig(config);
      setClients(clientList);
    } catch (error) {
      console.error("Error loading static data:", error);
    }
  }, [currentStudio?.id]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentStudio) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        await Promise.all([loadAppointmentData(), loadStaticData()]);
      } catch (error) {
        showToast({ title: "Error", description: "No se pudieron cargar los datos del calendario.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentStudio?.id, loadAppointmentData, loadStaticData, showToast]);

  // Convert studio working hours to FullCalendar businessHours format
  const businessHours = useMemo(() => {
    if (!studioConfig?.workingHours) return [];
    
    console.log('📅 Using studio config for business hours:', studioConfig.workingHours);
    
    return studioConfig.workingHours
      .filter(wh => wh.enabled)
      .map(wh => ({
        daysOfWeek: [wh.dayOfWeek],
        startTime: wh.startTime,
        endTime: wh.endTime
      }));
  }, [studioConfig]);

  // Calculate slot min/max time from working hours
  const { slotMinTime, slotMaxTime } = useMemo(() => {
    if (!studioConfig?.workingHours || studioConfig.workingHours.length === 0) {
      return { slotMinTime: "08:00:00", slotMaxTime: "20:00:00" };
    }

    const enabledHours = studioConfig.workingHours.filter(wh => wh.enabled);
    if (enabledHours.length === 0) {
      return { slotMinTime: "08:00:00", slotMaxTime: "20:00:00" };
    }

    const startTimes = enabledHours.map(wh => wh.startTime);
    const endTimes = enabledHours.map(wh => wh.endTime);
    
    const earliestStart = startTimes.sort()[0];
    const latestEnd = endTimes.sort().reverse()[0];
    
    return { 
      slotMinTime: earliestStart + ":00", 
      slotMaxTime: latestEnd + ":00" 
    };
  }, [studioConfig]);

  const refreshData = useCallback(async () => {
    if (!currentStudio) return;
    setLoading(true);
    try {
        const [appts, blocks, staffList, serviceList, config, clientList] = await Promise.all([
            getAppointments(currentStudio.id, dataRange.start, dataRange.end),
            getTimeBlocks(currentStudio.id, dataRange.start, dataRange.end),
            getStaffForStudio(currentStudio.id),
            getServicesForStudio(currentStudio.id),
            getStudioConfig(currentStudio.id),
            getStudioClients(currentStudio.id)
        ]);
        setAppointments(appts);
        setTimeBlocks(blocks);
        setStaff(staffList);
        setServices(serviceList);
        setStudioConfig(config);
        setClients(clientList);
    } catch (error) {
        console.error("Error refreshing calendar data:", error);
        showToast({ title: "Error", description: "No se pudieron cargar los datos del calendario.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [currentStudio?.id, dataRange.start, dataRange.end, showToast]);

  // Lightweight refresh that only updates appointments without affecting calendar position
  const refreshAppointments = useCallback(async () => {
    if (!currentStudio) return;
    try {
        const [appts, blocks] = await Promise.all([
            getAppointments(currentStudio.id, dataRange.start, dataRange.end),
            getTimeBlocks(currentStudio.id, dataRange.start, dataRange.end)
        ]);
        setAppointments(appts);
        setTimeBlocks(blocks);
    } catch (error) {
        console.error("Error refreshing appointments:", error);
        showToast({ title: "Error", description: "No se pudieron actualizar las citas.", variant: "destructive" });
    }
  }, [currentStudio?.id, dataRange.start, dataRange.end, showToast]);
  
  // Monitor calendar navigation and load data only when needed
  // DISABLED: Aggressive polling was causing issues with month navigation
  /*
  useEffect(() => {
    const checkIfDataNeeded = () => {
      if (calendarRef.current) {
        const currentRange = calendarRef.current.getCurrentRange();
        
        // Check if current calendar view is outside our loaded data range
        const needsData = 
          currentRange.start < dataRange.start || 
          currentRange.end > dataRange.end;
        
        if (needsData) {
          console.log('📅 Calendar moved outside data range, loading new data');
          // Expand data range to cover more than just the current view
          const expandedStart = new Date(currentRange.start);
          expandedStart.setDate(expandedStart.getDate() - 14); // Load 2 weeks before
          
          const expandedEnd = new Date(currentRange.end);
          expandedEnd.setDate(expandedEnd.getDate() + 14); // Load 2 weeks after
          
          setDataRange({ start: expandedStart, end: expandedEnd });
        }
      }
    };

    const interval = setInterval(checkIfDataNeeded, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [dataRange.start, dataRange.end]);
  */

  // Manual data range expansion when user navigates far
  const expandDataRange = useCallback(() => {
    if (calendarRef.current) {
      const currentRange = calendarRef.current.getCurrentRange();
      
      // Expand data range to cover 2 months before and after current view
      const expandedStart = new Date(currentRange.start);
      expandedStart.setMonth(expandedStart.getMonth() - 2);
      expandedStart.setDate(1);
      
      const expandedEnd = new Date(currentRange.end);
      expandedEnd.setMonth(expandedEnd.getMonth() + 2);
      expandedEnd.setMonth(expandedEnd.getMonth() + 1, 0);
      
      console.log('📅 Expanding data range:', { start: expandedStart, end: expandedEnd });
      setDataRange({ start: expandedStart, end: expandedEnd });
    }
  }, []);

  // SIMPLIFIED: No handleDatesSet - using polling approach instead

  const events: EventInput[] = useMemo(() => {
    const appointmentEvents = appointments.map(appt => ({
      id: appt.id,
      title: `${appt.serviceName} - ${appt.clientName}`,
      start: appt.start,
      end: appt.end,
      allDay: false,
      backgroundColor: '#22c55e',
      borderColor: '#16a34a',
      textColor: '#ffffff',
      extendedProps: {
        type: 'appointment',
        clientName: appt.clientName,
        serviceName: appt.serviceName,
        staffName: staff.find(s => s.uid === appt.staffId)?.displayName || 'Staff'
      }
    }));

    const timeBlockEvents = timeBlocks.map(block => ({
      id: `block-${block.id}`,
      title: `🔒 ${block.reason || 'Bloqueado'}`,
      start: block.start,
      end: block.end,
      allDay: block.isAllDay,
      backgroundColor: '#ef4444', 
      borderColor: '#dc2626',
      textColor: '#ffffff',
      extendedProps: {
        type: 'timeblock'
      }
    }));

    return [...appointmentEvents, ...timeBlockEvents];
  }, [appointments, timeBlocks, staff]);
  
  const updatePopoverPosition = (element: HTMLElement) => {
    if (popoverAnchorRef.current) {
        const rect = element.getBoundingClientRect();
        popoverAnchorRef.current.style.position = 'fixed';
        popoverAnchorRef.current.style.top = `${rect.top}px`;
        popoverAnchorRef.current.style.left = `${rect.right + 8}px`;
    }
  };

  const handleDateClick = useCallback((arg: any) => {
    // Si es un customer, redirigir a la página de reservas
    if (profile?.globalRole === 'customer') {
      router.push(`/customer/book/${currentStudio?.id}`);
      return;
    }
    
    // Para staff/owners, mostrar el modal
    setSelectedAppointment(null);
    setSelectedDate(arg.date);
    setSelectedClientEmail("");
    setCustomClientName("");
    updatePopoverPosition(arg.jsEvent.target);
    setIsPopoverOpen(true);
  }, [profile?.globalRole, router, currentStudio?.id]);

  const handleEventClick = useCallback((arg: any) => {
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
            setSelectedClientEmail(appt.clientEmail || "");
            setCustomClientName(appt.clientName || "");
            updatePopoverPosition(arg.el);
            setIsPopoverOpen(true);
        }
    }
  }, [timeBlocks, appointments]);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
        if (!currentStudio) return;
        
        const eventId = arg.event.id;
        
        try {
            if (eventId.startsWith('block-')) {
                // Handle time block drop
                const blockId = eventId.replace('block-', '');
                const block = timeBlocks.find(b => b.id === blockId);
                if (block) {
                    await addOrUpdateTimeBlock(currentStudio.id, {
                        ...block,
                        start: arg.event.start!,
                        end: arg.event.end!
                    });
                    await refreshAppointments();
                }
            } else {
                // Handle appointment drop
                const appointment = appointments.find(a => a.id === eventId);
                if (appointment) {
                    await addOrUpdateAppointment(currentStudio.id, {
                        ...appointment,
                        start: arg.event.start!,
                        end: arg.event.end!
                    });
                    await refreshAppointments();
                }
            }
        } catch (error) {
            console.error('Error moving event:', error);
            showToast({ title: "Error", description: "No se pudo mover el evento.", variant: "destructive" });
            arg.revert(); // Revert the change if it failed
        }
    }, [currentStudio, appointments, timeBlocks, refreshAppointments]); // Removido 'toast' de las dependencias

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
            showToast({ title: "Error", description: "Servicio no válido.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        const start = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
        const end = new Date(start.getTime() + service.duration * 60000);
        
        // Determine client info based on admin status
        let clientInfo: {
            clientId: string;
            clientEmail: string;
            clientName: string;
        };
        
        if (profile?.globalRole === 'customer') {
            // Customer booking for themselves
            clientInfo = {
                clientId: profile.uid,
                clientEmail: profile.email || '',
                clientName: profile.displayName || ''
            };
        } else {
            // Admin/staff booking for a client
            // Usar el email como clientId para citas creadas por admin/staff
            clientInfo = {
                clientId: selectedClientEmail, // Usar email como ID único para clientes
                clientEmail: selectedClientEmail,
                clientName: customClientName || selectedClientEmail.split('@')[0]
            };
        }

        try {
            await addOrUpdateAppointment(currentStudio.id, {
                id: selectedAppointment?.id,
                serviceId,
                serviceName: service.name,
                staffId,
                clientId: clientInfo.clientId,
                clientEmail: clientInfo.clientEmail,
                clientName: clientInfo.clientName,
                start,
                end
            });
            setIsPopoverOpen(false);
            await refreshAppointments();
            showToast({ title: "Cita guardada con éxito" });
        } catch (error) {
            showToast({ title: "Error", description: "No se pudo guardar la cita.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    const handleDeleteAppointment = async () => {
        if (!selectedAppointment || !currentStudio) return;
        try {
            await deleteAppointment(currentStudio.id, selectedAppointment.id);
            setIsPopoverOpen(false);
            await refreshAppointments();
            showToast({ title: "Cita eliminada" });
        } catch (error) {
            showToast({ title: "Error", description: "No se pudo eliminar la cita.", variant: "destructive" });
        }
    };

    const handleSaveBlock = useCallback(async (blockData: Omit<TimeBlock, 'id' | 'createdAt'> & { id?: string }) => {
        if (!currentStudio) {
            showToast({ title: "Error", description: "ID del estudio no encontrado.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const dataToSave = { ...blockData, id: selectedBlock?.id };
            await addOrUpdateTimeBlock(currentStudio.id, dataToSave);
            await refreshAppointments();
            setIsBlockModalOpen(false);
            showToast({ title: "Éxito", description: "El bloqueo se ha guardado correctamente." });
        } catch (error) {
            showToast({ title: "Error", description: "No se pudo guardar el bloqueo.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [currentStudio, refreshAppointments, selectedBlock]); // Removido 'toast' de las dependencias

    const handleDeleteBlock = useCallback(async (blockId: string) => {
        if (!currentStudio) return;
        if (confirm('¿Estás seguro de que quieres eliminar este bloqueo?')) {
            setIsSaving(true);
            try {
                await deleteTimeBlock(currentStudio.id, blockId);
                await refreshAppointments();
                setIsBlockModalOpen(false);
                showToast({ title: "Bloqueo Eliminado" });
            } catch (e) {
                showToast({ title: "Error", description: "No se pudo eliminar el bloqueo.", variant: "destructive" });
            } finally {
                setIsSaving(false);
            }
        }
    }, [currentStudio, refreshAppointments]); // Removido 'toast' de las dependencias

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  if (!currentStudio) {
    return <div className="text-center p-8">Selecciona un estudio para ver el calendario.</div>
  }

  const BookingForm = () => (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverAnchor asChild>
            <div ref={popoverAnchorRef} />
        </PopoverAnchor>
        <PopoverContent className="w-96 p-4" align="start">
            <form onSubmit={handleSaveAppointment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Servicio</label>
                        <Select name="serviceId" defaultValue={selectedAppointment?.serviceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar servicio" />
                            </SelectTrigger>
                            <SelectContent>
                                {services.filter(service => service.id).map(service => (
                                    <SelectItem key={service.id} value={service.id!}>
                                        {service.name} ({service.duration}min)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Staff</label>
                        <Select name="staffId" defaultValue={selectedAppointment?.staffId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar staff" />
                            </SelectTrigger>
                            <SelectContent>
                                {staff.map(staffMember => (
                                    <SelectItem key={staffMember.uid} value={staffMember.uid}>
                                        {staffMember.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">Fecha</label>
                        <Input 
                            type="date" 
                            name="date" 
                            defaultValue={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''} 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Hora</label>
                        <Input 
                            type="time" 
                            name="time" 
                            defaultValue={selectedDate ? format(selectedDate, 'HH:mm') : ''} 
                        />
                    </div>
                </div>
                
                {/* Only show client fields if user is admin/staff */}
                {profile?.globalRole !== 'customer' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cliente</label>
                        <div className="space-y-2">
                            {/* Dropdown para clientes existentes */}
                            {clients.length > 0 && (
                                <Select 
                                    value={selectedClientEmail} 
                                    onValueChange={(value) => {
                                        setSelectedClientEmail(value);
                                        const selectedClient = clients.find(c => c.email === value);
                                        if (selectedClient) {
                                            setCustomClientName(selectedClient.displayName || '');
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cliente existente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                            <SelectItem key={client.email} value={client.email}>
                                                {client.displayName || client.email} ({client.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            
                            {/* Campos para nuevo cliente o editar existente */}
                            <Input 
                                type="email" 
                                placeholder="Email del cliente" 
                                value={selectedClientEmail}
                                onChange={(e) => setSelectedClientEmail(e.target.value)}
                            />
                            <Input 
                                type="text" 
                                placeholder="Nombre del cliente (opcional)" 
                                value={customClientName}
                                onChange={(e) => setCustomClientName(e.target.value)}
                            />
                        </div>
                    </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  {selectedAppointment && (
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button type="button" variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteAppointment}>
                                      Eliminar
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  )}
                  <Button type="submit" disabled={isSaving} className="ml-auto">{isSaving ? <Loader2 className="animate-spin" /> : 'Guardar'}</Button>
                </div>
            </form>
        </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex flex-col h-[85vh] w-full bg-card rounded-xl border overflow-hidden">
        <div ref={popoverAnchorRef} style={{ position: 'fixed', zIndex: 1000 }} />
        
        {/* Header con botones */}
        <div className="flex justify-between items-center p-4 border-b bg-background">
            <h2 className="text-xl font-semibold">Calendario de Turnos</h2>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={expandDataRange}
                    title="Cargar más datos para navegación lejana"
                >
                    Expandir Rango
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshData}
                    disabled={loading}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
                    Actualizar
                </Button>
                {canBlockAgenda && (
                <Button variant="outline" onClick={() => { setSelectedBlock(null); setIsBlockModalOpen(true);}}>
                    <Lock className="mr-2 h-4 w-4"/>Bloquear Horario
                </Button>
                )}
            </div>
        </div>
        
        {/* Contenedor del calendario */}
        <div className="flex-1 p-4 overflow-hidden">
            {loading ? (
                <div className="flex h-full w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Cargando calendario...</p>
                    </div>
                </div>
            ) : (
                <AppointmentsFullCalendar 
                    ref={calendarRef}
                    events={events}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                    onEventDrop={handleEventDrop}
                    businessHours={businessHours}
                    slotMinTime={slotMinTime}
                    slotMaxTime={slotMaxTime}
                />
            )}
        </div>
        
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

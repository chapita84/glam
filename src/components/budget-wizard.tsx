
"use client"

import { useState, useEffect, useMemo } from "react"
import { handleAIGeneration } from "@/app/(app)/budgets/actions"
import { saveBudgetClient } from "@/lib/firebase/budget-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wand2, PartyPopper, Truck, FileText, Loader2, PlusCircle, Trash2, Save, Send, CheckCircle, XCircle, Library, CirclePlus } from "lucide-react"
import { BudgetDownloadButton } from "./budget-download-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { debugUserPermissions } from "@/lib/debug-permissions"
import { type Budget, type Service, type BudgetItem } from "@/lib/types"
import { getServicesForStudio } from "@/lib/firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { ScrollArea } from "./ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

const steps = [
  { id: 1, name: "Detalles del Evento", icon: PartyPopper },
  { id: 2, name: "Servicios", icon: Wand2 },
  { id: 3, name: "Costos y Estado", icon: Truck },
  { id: 4, name: "Resumen y Acciones", icon: FileText },
]

const statusOptions: { value: Budget['status'], label: string, icon: React.ElementType }[] = [
    { value: 'draft', label: 'Borrador', icon: Wand2 },
    { value: 'sent', label: 'Enviado', icon: Send },
    { value: 'approved', label: 'Confirmado', icon: CheckCircle },
    { value: 'rejected', label: 'Rechazado', icon: XCircle },
    { value: 'canceled', label: 'Cancelado', icon: XCircle },
]

interface BudgetWizardProps {
    studioId: string;
    initialBudget: Budget | null;
    onSave: () => void;
}

export function BudgetWizard({ studioId, initialBudget, onSave }: BudgetWizardProps) {
  const [serviceTemplates, setServiceTemplates] = useState<Service[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  
  const [eventDetails, setEventDetails] = useState({
      clientName: initialBudget?.clientName || "",
      eventType: initialBudget?.eventInfo?.type || "",
      eventDate: initialBudget?.eventInfo?.date ? new Date(initialBudget.eventInfo.date).toISOString().split('T')[0] : "",
      eventTime: initialBudget?.eventInfo?.time || "12:00",
      eventLocation: initialBudget?.eventInfo?.location || "",
  });
  const [items, setItems] = useState<BudgetItem[]>(initialBudget?.items || []);
  const [logisticsCost, setLogisticsCost] = useState(initialBudget?.summary?.logistics || 50);
  const [usdRate, setUsdRate] = useState(initialBudget?.summary?.exchangeRate || 1000);
  const [status, setStatus] = useState<Budget['status']> (initialBudget?.status || 'draft');

  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Determinar si estamos editando o creando
  const isEditing = !!initialBudget?.id;
  const budgetId = initialBudget?.id;
  
  // Reglas de edición según el estado
  const canEditContent = status === 'draft' || status === 'rejected';
  const canEditStatus = status !== 'rejected' && status !== 'canceled';
  
  // Obtener opciones de estado válidas según el estado actual
  const getValidStatusOptions = (currentStatus: Budget['status']) => {
    switch (currentStatus) {
      case 'draft':
        return statusOptions.filter(option => option.value === 'draft' || option.value === 'sent');
      case 'sent':
        return statusOptions.filter(option => option.value === 'sent' || option.value === 'approved' || option.value === 'rejected');
      case 'approved':
        return statusOptions.filter(option => option.value === 'approved' || option.value === 'canceled');
      case 'rejected':
      case 'canceled':
        return statusOptions.filter(option => option.value === currentStatus);
      default:
        return statusOptions;
    }
  };
  
  const handleAIClick = async (formData: FormData) => {
    setAiLoading(true);
    try {
      const result = await handleAIGeneration({ message: "" }, formData);
      if (result.message) {
        toast({ title: "IA", description: result.message });
        if (result.data) {
          setItems(result.data);
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Error generando con IA", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveClick = async () => {
    console.log('=== BudgetWizard Save Click DEBUG ===');
    console.log('studioId:', studioId);
    console.log('studioId type:', typeof studioId);
    console.log('studioId is undefined?', studioId === undefined);
    console.log('studioId is null?', studioId === null);
    console.log('studioId is empty string?', studioId === '');
    console.log('eventDetails:', eventDetails);
    console.log('items:', items);
    console.log('logisticsCost:', logisticsCost);
    console.log('usdRate:', usdRate);
    console.log('status:', status);
    
    // Verificar permisos del usuario
    const permissionsDebug = await debugUserPermissions(studioId);
    console.log('🔐 Permissions debug result:', permissionsDebug);
    
    setSaveLoading(true);
    try {
      // Construir los datos del presupuesto
      const budgetData = {
        ...(budgetId && { id: budgetId }), // Incluir ID solo si estamos editando
        budgetName: `${eventDetails.eventType} - ${eventDetails.clientName}`,
        clientName: eventDetails.clientName,
        status: status,
        statusHistory: initialBudget?.statusHistory || [], // Preservar historial existente
        eventInfo: {
          type: eventDetails.eventType,
          date: eventDetails.eventDate,
          time: eventDetails.eventTime,
          location: eventDetails.eventLocation
        },
        items: items,
        summary: {
          subtotal: servicesSubtotal,
          logistics: logisticsCost,
          totalUSD: totalUSD,
          exchangeRate: usdRate,
          totalARS: totalARS
        }
      };
      
      console.log('Calling saveBudgetClient with data:', budgetData);
      
      // Verificar que tenemos información del usuario
      if (!currentUser) {
        toast({ 
          title: "Error", 
          description: "No se pudo identificar el usuario",
          variant: "destructive"
        });
        return;
      }
      
      const userInfo = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email || 'Usuario'
      };
      
      // Usar la función del cliente en lugar del Server Action
      const result = await saveBudgetClient(studioId, budgetData, userInfo);
      console.log('saveBudgetClient result:', result);
      
      if (result.success) {
        toast({ 
          title: "Presupuesto", 
          description: result.message,
          variant: "default"
        });
        onSave?.();
      } else {
        toast({ 
          title: "Error", 
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in handleSaveClick:', error);
      toast({ title: "Error", description: "Error guardando presupuesto", variant: "destructive" });
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    async function loadServices() {
        if (studioId) {
            const services = await getServicesForStudio(studioId);
            setServiceTemplates(services);
        }
    }
    loadServices();
  }, [studioId]);

  const { servicesSubtotal, totalUSD, totalARS, budgetPDFData, pdfFileName } = useMemo(() => {
    const servicesSubtotal = items.reduce((total, item) => total + ((item.quantity || 0) * (item.unitCost.amount || 0)), 0);
    const totalUSD = servicesSubtotal + (logisticsCost || 0);
    const totalARS = totalUSD * (usdRate || 0);
    const budgetPDFData = {
      eventType: eventDetails.eventType, eventDate: eventDetails.eventDate, eventLocation: eventDetails.eventLocation,
      services: items, // Pass BudgetItem[] directly instead of mapping
      servicesTotal: servicesSubtotal, logisticsCost, totalUSD, totalARS, usdRate,
    }
    const pdfFileName = `Presupuesto-${eventDetails.eventType}-${eventDetails.clientName}.pdf`;
    return { servicesSubtotal, totalUSD, totalARS, budgetPDFData, pdfFileName };
  }, [items, logisticsCost, usdRate, eventDetails]);
  

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => setCurrentStep(s => Math.min(s + 1, steps.length - 1));
  const handlePrev = () => setCurrentStep(s => Math.max(s - 1, 0));

  const handleEventDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEventDetails({...eventDetails, [e.target.id]: e.target.value });
  }

  const handleItemChange = (index: number, field: keyof BudgetItem, value: any) => {
      const newItems = [...items];
      const item = { ...newItems[index] };

      if (field === 'unitCost') {
          item.unitCost = { ...item.unitCost, amount: parseFloat(value) || 0 };
      } else {
          (item as any)[field] = (field === 'quantity' || field === 'duration') ? parseInt(value, 10) || 0 : value;
      }
      
      newItems[index] = item;
      setItems(newItems);
  };
  
  const addItem = (item: BudgetItem) => setItems([...items, item]);
  
  const addServiceFromTemplate = (template: Service) => {
    addItem({
        description: template.name,
        category: template.categoryId || 'General',
        quantity: 1,
        unitCost: { amount: template.price, currency: 'USD' },
        duration: template.duration
    });
    setTemplateModalOpen(false);
  }

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  
  const AIGenerateButton = () => {
    return <Button type="submit" disabled={aiLoading}>{aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} Generar Sugerencias</Button>
  }

  const SaveBudgetButton = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => {
    return <Button onClick={onClick} className="w-full" disabled={saveLoading || !studioId}>{saveLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {children}</Button>
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Progress value={progress} className="mb-8" />
      <div className="mb-8">
        <h2 className="text-2xl font-bold">{steps[currentStep].name}</h2>
        <p className="text-muted-foreground">Paso {currentStep + 1} de {steps.length}</p>
      </div>

      <div className="space-y-6 min-h-[400px]">
        {currentStep === 0 && (
            <div className="space-y-4">
                <Input 
                    id="clientName" 
                    placeholder="Nombre del Cliente" 
                    value={eventDetails.clientName} 
                    onChange={handleEventDetailsChange}
                    disabled={!canEditContent}
                />
                <Input 
                    id="eventType" 
                    placeholder="Tipo de Evento" 
                    value={eventDetails.eventType} 
                    onChange={handleEventDetailsChange}
                    disabled={!canEditContent}
                />
                <Input 
                    id="eventDate" 
                    type="date" 
                    value={eventDetails.eventDate} 
                    onChange={handleEventDetailsChange}
                    disabled={!canEditContent}
                />
                <Input 
                    id="eventTime" 
                    type="time" 
                    value={eventDetails.eventTime} 
                    onChange={handleEventDetailsChange}
                    disabled={!canEditContent}
                />
                <Input 
                    id="eventLocation" 
                    placeholder="Ubicación" 
                    value={eventDetails.eventLocation} 
                    onChange={handleEventDetailsChange}
                    disabled={!canEditContent}
                />
            </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
             {canEditContent && (
               <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleAIClick(formData); }} className="space-y-4 p-4 border rounded-lg">
                  <Textarea id="eventTypeDescription" name="eventTypeDescription" placeholder="Describa el evento para recibir sugerencias de la IA..." />
                  <AIGenerateButton />
               </form>
             )}
             <Table>
                <TableHeader><TableRow><TableHead>Servicio</TableHead><TableHead>Cant.</TableHead><TableHead>Dur.</TableHead><TableHead>Precio</TableHead><TableHead>Total</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Input 
                                    value={item.description} 
                                    onChange={e => handleItemChange(index, 'description', e.target.value)}
                                    disabled={!canEditContent}
                                />
                            </TableCell>
                            <TableCell>
                                <Input 
                                    type="number" 
                                    value={item.quantity} 
                                    onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                                    className="w-16"
                                    disabled={!canEditContent}
                                />
                            </TableCell>
                            <TableCell>
                                <Input 
                                    type="number" 
                                    value={item.duration || ''} 
                                    onChange={e => handleItemChange(index, 'duration', e.target.value)} 
                                    className="w-20"
                                    disabled={!canEditContent}
                                />
                            </TableCell>
                            <TableCell>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={item.unitCost.amount} 
                                    onChange={e => handleItemChange(index, 'unitCost', e.target.value)} 
                                    className="w-24"
                                    disabled={!canEditContent}
                                />
                            </TableCell>
                            <TableCell>${((item.quantity || 0) * (item.unitCost.amount || 0)).toFixed(2)}</TableCell>
                            <TableCell>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeItem(index)}
                                    disabled={!canEditContent}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
             {canEditContent && (
               <div className="flex gap-2">
                  <Button variant="outline" onClick={() => addItem({ description: 'Nuevo Servicio', quantity: 1, unitCost: { amount: 0, currency: 'USD' }, duration: 30, category: 'General' })}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Manualmente</Button>
                  <Dialog open={isTemplateModalOpen} onOpenChange={setTemplateModalOpen}>
                      <DialogTrigger asChild><Button variant="outline"><Library className="mr-2 h-4 w-4" /> Añadir desde Plantilla</Button></DialogTrigger>
                      <DialogContent><DialogHeader><DialogTitle>Seleccionar Servicio</DialogTitle></DialogHeader>
                          <ScrollArea className="max-h-96"><div className="p-4 space-y-2">
                             {serviceTemplates.map(template => (<div key={template.id} className="flex items-center justify-between p-2 border rounded-lg"><div><p className="font-semibold">{template.name}</p></div><Button size="icon" variant="ghost" onClick={() => addServiceFromTemplate(template)}><CirclePlus className="h-5 w-5" /></Button></div>))}
                          </div></ScrollArea>
                      </DialogContent>
                  </Dialog>
               </div>
             )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
                <Label htmlFor="logisticsCost">Costo de Logística (USD)</Label>
                <Input 
                    id="logisticsCost" 
                    type="number" 
                    value={logisticsCost} 
                    onChange={e => setLogisticsCost(parseFloat(e.target.value) || 0)}
                    disabled={!canEditContent}
                />
            </div>
            <div>
                <Label htmlFor="usdRate">Tasa de Cambio (USD a ARS)</Label>
                <Input 
                    id="usdRate" 
                    type="number" 
                    value={usdRate} 
                    onChange={e => setUsdRate(parseFloat(e.target.value) || 0)}
                    disabled={!canEditContent}
                />
            </div>
            <div>
                <Label>Estado del Presupuesto</Label>
                 <Select value={status} onValueChange={(v: Budget['status']) => setStatus(v)} disabled={!canEditStatus}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                    <SelectContent>
                        {getValidStatusOptions(status).map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                    <option.icon className="h-4 w-4" />
                                    <span>{option.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-6">
                <div className="p-6 border rounded-lg space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span className="font-medium">{eventDetails.clientName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total (USD):</span><span className="font-bold">${totalUSD.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total (ARS):</span><span className="font-bold">${totalARS.toLocaleString('es-AR')}</span></div>
                </div>
                
                {/* Historial de Estados */}
                {initialBudget?.statusHistory && initialBudget.statusHistory.length > 0 && (
                    <div className="p-6 border rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Historial de Estados</h3>
                        <div className="space-y-3">
                            {initialBudget.statusHistory.map((historyEntry, index) => {
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
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <StatusIcon className="h-4 w-4" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{statusLabel}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        por {historyEntry.userName || historyEntry.userEmail || 'Usuario desconocido'}
                                                    </span>
                                                </div>
                                                {historyEntry.notes && (
                                                    <p className="text-sm text-muted-foreground">{historyEntry.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            <div>{timestamp.toLocaleDateString('es-AR')}</div>
                                            <div>{timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                    <BudgetDownloadButton data={budgetPDFData} fileName={pdfFileName} />
                    <SaveBudgetButton onClick={() => handleSaveClick()}>
                        {initialBudget ? "Guardar Cambios" : "Guardar Presupuesto"}
                    </SaveBudgetButton>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>Anterior</Button>
        {currentStep < steps.length - 1 ? <Button onClick={handleNext}>Siguiente</Button> : <Button disabled>Finalizar</Button>}
      </div>
    </div>
  )
}


"use client"

import { useActionState, useState, useEffect, useMemo } from "react"
import { useFormStatus } from "react-dom"
import { handleAIGeneration, handleSaveBudget } from "@/app/(app)/budgets/actions"
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
import { type Budget, type Service, type BudgetItem } from "@/lib/types"
import { getServicesForStudio } from "@/lib/firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { ScrollArea } from "./ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

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
  const [aiState, aiFormAction] = useActionState(handleAIGeneration, { message: "" });
  
  const saveBudgetWithStudioId = handleSaveBudget.bind(null, studioId);
  const [budgetState, budgetFormAction] = useActionState(saveBudgetWithStudioId, { message: "" });

  useEffect(() => {
    async function loadServices() {
        if (studioId) {
            const services = await getServicesForStudio(studioId);
            setServiceTemplates(services);
        }
    }
    loadServices();
  }, [studioId]);


  useEffect(() => {
    if (aiState.message === 'success' && aiState.data) {
        setItems(aiState.data);
        toast({ title: "Sugerencias generadas", description: "Se han añadido servicios sugeridos por la IA." });
    } else if (aiState.message && aiState.message !== 'success') {
        toast({ title: "Error de IA", description: aiState.message, variant: 'destructive' });
    }
  }, [aiState, toast]);

  useEffect(() => {
    if (budgetState.message === 'success') {
        toast({ title: "¡Éxito!", description: "El presupuesto se ha guardado correctamente." });
        onSave();
    } else if (budgetState.message && budgetState.message !== 'success') {
        toast({ title: "Error al guardar", description: budgetState.message, variant: 'destructive' });
    }
  }, [budgetState, onSave, toast]);

  const { servicesSubtotal, totalUSD, totalARS, budgetPDFData, pdfFileName } = useMemo(() => {
    const servicesSubtotal = items.reduce((total, item) => total + ((item.quantity || 0) * (item.unitCost.amount || 0)), 0);
    const totalUSD = servicesSubtotal + (logisticsCost || 0);
    const totalARS = totalUSD * (usdRate || 0);
    const budgetPDFData = {
      eventType: eventDetails.eventType, eventDate: eventDetails.eventDate, eventLocation: eventDetails.eventLocation,
      services: items.map(i => ({ name: i.description, quantity: i.quantity, price: i.unitCost.amount })),
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
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} Generar Sugerencias</Button>
  }

  const SaveBudgetButton = ({ children }: { children: React.ReactNode }) => {
    const { pending } = useFormStatus();
    return <Button type="submit" className="w-full" disabled={pending || !studioId}>{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {children}</Button>
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
                <Input id="clientName" placeholder="Nombre del Cliente" value={eventDetails.clientName} onChange={handleEventDetailsChange} />
                <Input id="eventType" placeholder="Tipo de Evento" value={eventDetails.eventType} onChange={handleEventDetailsChange} />
                <Input id="eventDate" type="date" value={eventDetails.eventDate} onChange={handleEventDetailsChange} />
                <Input id="eventTime" type="time" value={eventDetails.eventTime} onChange={handleEventDetailsChange} />
                <Input id="eventLocation" placeholder="Ubicación" value={eventDetails.eventLocation} onChange={handleEventDetailsChange} />
            </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
             <form action={aiFormAction} className="space-y-4 p-4 border rounded-lg">
                <Textarea id="eventTypeDescription" name="eventTypeDescription" placeholder="Describa el evento para recibir sugerencias de la IA..." />
                <AIGenerateButton />
             </form>
             <Table>
                <TableHeader><TableRow><TableHead>Servicio</TableHead><TableHead>Cant.</TableHead><TableHead>Dur.</TableHead><TableHead>Precio</TableHead><TableHead>Total</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell><Input value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} /></TableCell>
                            <TableCell><Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-16"/></TableCell>
                            <TableCell><Input type="number" value={item.duration || ''} onChange={e => handleItemChange(index, 'duration', e.target.value)} className="w-20"/></TableCell>
                            <TableCell><Input type="number" step="0.01" value={item.unitCost.amount} onChange={e => handleItemChange(index, 'unitCost', e.target.value)} className="w-24"/></TableCell>
                            <TableCell>${((item.quantity || 0) * (item.unitCost.amount || 0)).toFixed(2)}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
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
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div><Label htmlFor="logisticsCost">Costo de Logística (USD)</Label><Input id="logisticsCost" type="number" value={logisticsCost} onChange={e => setLogisticsCost(parseFloat(e.target.value) || 0)}/></div>
            <div><Label htmlFor="usdRate">Tasa de Cambio (USD a ARS)</Label><Input id="usdRate" type="number" value={usdRate} onChange={e => setUsdRate(parseFloat(e.target.value) || 0)}/></div>
            <div><Label>Estado del Presupuesto</Label>
                 <Select value={status} onValueChange={(v: Budget['status']) => setStatus(v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                    <SelectContent>{statusOptions.map(option => (<SelectItem key={option.value} value={option.value}><div className="flex items-center gap-2"><option.icon className="h-4 w-4" /><span>{option.label}</span></div></SelectItem>))}</SelectContent>
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
                <div className="grid md:grid-cols-2 gap-4">
                    <BudgetDownloadButton data={budgetPDFData} fileName={pdfFileName} />
                    <form action={budgetFormAction}>
                        <input type="hidden" name="id" value={initialBudget?.id || ''} />
                        <input type="hidden" name="budgetName" value={`${eventDetails.eventType} - ${eventDetails.clientName}`} />
                        <input type="hidden" name="clientName" value={eventDetails.clientName} />
                        <input type="hidden" name="status" value={status} />
                        <input type="hidden" name="eventInfo" value={JSON.stringify({type: eventDetails.eventType, date: eventDetails.eventDate, time: eventDetails.eventTime, location: eventDetails.eventLocation})} />
                        <input type="hidden" name="items" value={JSON.stringify(items)} />
                        <input type="hidden" name="summary" value={JSON.stringify({subtotal: servicesSubtotal, logistics: logisticsCost, totalUSD: totalUSD, exchangeRate: usdRate, totalARS: totalARS})} />
                        <SaveBudgetButton>{initialBudget ? "Guardar Cambios" : "Guardar Presupuesto"}</SaveBudgetButton>
                    </form>
                </div>
                 {budgetState.message && budgetState.message !== 'success' && (<Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{budgetState.message}</AlertDescription></Alert>)}
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

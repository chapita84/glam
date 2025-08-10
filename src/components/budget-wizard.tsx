
"use client"

import { useActionState, useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { handleGenerateBudget, handleSaveBudget, type BudgetItem, type AIGenerationFormState } from "@/app/(app)/budgets/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Terminal, Wand2, PartyPopper, Truck, FileText, Loader2, PlusCircle, Trash2, Save, Send, CheckCircle, XCircle } from "lucide-react"
import { BudgetDownloadButton } from "./budget-download-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { type Budget } from "@/lib/firebase/firestore"

const steps = [
  { id: 1, name: "Detalles del Evento", icon: PartyPopper },
  { id: 2, name: "Servicios", icon: Wand2 },
  { id: 3, name: "Costos y Estado", icon: Truck },
  { id: 4, name: "Resumen y Acciones", icon: FileText },
]

const statusOptions = [
    { value: 'in_preparation', label: 'En Preparación', icon: Wand2 },
    { value: 'sent', label: 'Enviado', icon: Send },
    { value: 'confirmed', label: 'Confirmado', icon: CheckCircle },
    { value: 'rejected', label: 'Rechazado', icon: XCircle },
]

export function BudgetWizard({ tenantId, initialBudget, onSave }: { tenantId: string, initialBudget: Budget | null, onSave: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  
  // Initialize state from initialBudget or with default values
  const [eventDetails, setEventDetails] = useState({
      eventType: initialBudget?.eventType || "",
      eventDate: initialBudget?.eventDate ? new Date(initialBudget.eventDate).toISOString().split('T')[0] : "",
      eventTime: initialBudget?.eventTime || "12:00",
      eventLocation: initialBudget?.eventLocation || "",
  })
  const [services, setServices] = useState<BudgetItem[]>(initialBudget?.services || []);
  const [logisticsCost, setLogisticsCost] = useState(initialBudget?.logisticsCost || 50);
  const [usdRate, setUsdRate] = useState(initialBudget?.usdRate || 900);
  const [status, setStatus] = useState<'in_preparation' | 'sent' | 'confirmed' | 'rejected'>(initialBudget?.status || 'in_preparation');

  const [aiState, aiFormAction] = useActionState(handleGenerateBudget, { message: "" });
  const [budgetState, budgetFormAction] = useActionState(handleSaveBudget, { message: "" });


  useEffect(() => {
    if (aiState.message === 'success' && aiState.data) {
        setServices(aiState.data);
    }
  }, [aiState]);

  useEffect(() => {
    if (budgetState.message === 'success') {
        onSave();
    }
  }, [budgetState, onSave]);

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleEventDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEventDetails({...eventDetails, [e.target.id]: e.target.value });
  }

  const handleServiceChange = (index: number, field: keyof BudgetItem, value: string | number) => {
      const newServices = [...services];
      const parsedValue = typeof value === 'string' && (field === 'quantity' || field === 'price' || field === 'duration') ? parseFloat(value) : value;
      (newServices[index] as any)[field] = parsedValue;
      setServices(newServices);
  };

  const addService = () => {
      setServices([...services, { name: 'Nuevo Servicio', quantity: 1, price: 0, duration: 30 }]);
  };

  const removeService = (index: number) => {
      setServices(services.filter((_, i) => i !== index));
  };
  
  const servicesTotal = services.reduce((total, service) => total + ((service.quantity || 0) * (service.price || 0)), 0);
  const totalUSD = servicesTotal + (logisticsCost || 0);
  const totalARS = totalUSD * (usdRate || 0);

  const budgetData = {
    ...eventDetails,
    services,
    servicesTotal,
    logisticsCost,
    totalUSD,
    totalARS,
    usdRate,
  }

  const pdfFileName = eventDetails.eventType 
    ? `Presupuesto-${eventDetails.eventType.replace(/\s+/g, '-')}.pdf`
    : "Presupuesto.pdf";

  const AIGenerateButton = () => {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generar Sugerencias
        </Button>
    )
  }

  const SaveBudgetButton = ({ children }: { children: React.ReactNode }) => {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
             {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             { children }
        </Button>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Progress value={progress} className="mb-8" />
      <div className="mb-8">
        <h2 className="text-2xl font-bold">{steps[currentStep].name}</h2>
        <p className="text-muted-foreground">Paso {currentStep + 1} de {steps.length}</p>
      </div>

      <div className="space-y-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Input id="eventType" placeholder="p. ej., Boda, Gala Corporativa" value={eventDetails.eventType} onChange={handleEventDetailsChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Fecha del Evento</Label>
                <Input id="eventDate" type="date" value={eventDetails.eventDate} onChange={handleEventDetailsChange} />
              </div>
               <div>
                <Label htmlFor="eventTime">Hora del Evento</Label>
                <Input id="eventTime" type="time" value={eventDetails.eventTime} onChange={handleEventDetailsChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="eventLocation">Ubicación</Label>
              <Input id="eventLocation" placeholder="p. ej., Calle Principal 123, Cualquier Ciudad" value={eventDetails.eventLocation} onChange={handleEventDetailsChange} />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
             <form action={aiFormAction} className="space-y-4 p-4 border rounded-lg">
                <Label htmlFor="eventTypeDescription">Genera servicios sugeridos con IA describiendo el estilo del evento</Label>
                <Textarea
                    id="eventTypeDescription"
                    name="eventTypeDescription"
                    placeholder="p. ej., 'Una boda romántica y clásica con un enfoque en la belleza natural.' o 'Una fiesta de 15 años moderna y chic.'"
                    rows={3}
                />
                {aiState.errors?.eventTypeDescription && <p className="text-sm font-medium text-destructive">{aiState.errors.eventTypeDescription[0]}</p>}
                <AIGenerateButton />
                 {aiState.message && aiState.message !== 'success' && (
                    <Alert variant="destructive" className="mt-4">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{aiState.message}</AlertDescription>
                    </Alert>
                )}
             </form>

             <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Servicio</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Duración (min)</TableHead>
                            <TableHead>Precio (USD)</TableHead>
                            <TableHead>Total (USD)</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Input value={service.name} onChange={e => handleServiceChange(index, 'name', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" value={service.quantity} onChange={e => handleServiceChange(index, 'quantity', e.target.value)} />
                                </TableCell>
                                 <TableCell>
                                    <Input type="number" value={service.duration} onChange={e => handleServiceChange(index, 'duration', e.target.value)} />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" step="0.01" value={service.price} onChange={e => handleServiceChange(index, 'price', e.target.value)} />
                                </TableCell>
                                <TableCell>${((service.quantity || 0) * (service.price || 0)).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeService(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button variant="outline" onClick={addService}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Servicio Manualmente
                </Button>
             </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="logisticsCost">Costo de Viaje y Logística (USD)</Label>
              <Input id="logisticsCost" type="number" placeholder="$" value={logisticsCost} onChange={e => setLogisticsCost(parseFloat(e.target.value) || 0)}/>
              <p className="text-sm text-muted-foreground mt-2">Introduce cualquier costo de viaje o viáticos asociados con el evento en USD.</p>
            </div>
             <div>
              <Label htmlFor="usdRate">Tasa de Cambio (USD a ARS)</Label>
              <Input id="usdRate" type="number" placeholder="$" value={usdRate} onChange={e => setUsdRate(parseFloat(e.target.value) || 0)}/>
              <p className="text-sm text-muted-foreground mt-2">Introduce la tasa de cambio actual para calcular el total en ARS.</p>
            </div>
            <div>
                <Label>Estado del Presupuesto</Label>
                 <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                       {statusOptions.map(option => (
                           <SelectItem key={option.value} value={option.value}>
                               <div className="flex items-center gap-2">
                                <option.icon className="h-4 w-4" />
                                <span>{option.label}</span>
                               </div>
                           </SelectItem>
                       ))}
                    </SelectContent>
                </Select>
                 <p className="text-sm text-muted-foreground mt-2">Actualiza el estado del presupuesto. Si lo marcas como "Confirmado", se creará una cita en la agenda.</p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-6">
                 <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Resumen del Presupuesto</AlertTitle>
                  <AlertDescription>
                    Revisa los detalles a continuación. Puedes exportar el PDF o guardar los cambios. La tasa de cambio utilizada es 1 USD = {usdRate} ARS.
                  </AlertDescription>
                </Alert>
                <div className="p-6 border rounded-lg space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo de Evento:</span>
                        <span className="font-medium">{eventDetails.eventType}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Ubicación:</span>
                        <span className="font-medium">{eventDetails.eventLocation}</span>
                    </div>
                    <div className="border-t pt-4 mt-4">
                         {services.map((service, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{service.name} x{service.quantity}</span>
                                <span>${((service.quantity || 0) * (service.price || 0)).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-muted-foreground">Subtotal Servicios:</span>
                        <span className="font-medium">${servicesTotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Logística:</span>
                        <span className="font-medium">${(logisticsCost || 0).toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-lg font-bold border-t pt-4 mt-4">
                        <span>Total (USD):</span>
                        <span>${totalUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total (ARS):</span>
                        <span>${totalARS.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <BudgetDownloadButton data={budgetData} fileName={pdfFileName} />
                     <form action={budgetFormAction}>
                        <input type="hidden" name="id" value={initialBudget?.id} />
                        <input type="hidden" name="tenantId" value={tenantId} />
                        <input type="hidden" name="eventType" value={eventDetails.eventType} />
                        <input type="hidden" name="eventDate" value={eventDetails.eventDate} />
                        <input type="hidden" name="eventTime" value={eventDetails.eventTime} />
                        <input type="hidden" name="eventLocation" value={eventDetails.eventLocation} />
                        <input type="hidden" name="services" value={JSON.stringify(services)} />
                        <input type="hidden" name="logisticsCost" value={logisticsCost} />
                        <input type="hidden" name="usdRate" value={usdRate} />
                        <input type="hidden" name="status" value={status} />
                        <SaveBudgetButton>
                            {initialBudget ? "Guardar Cambios" : "Guardar Presupuesto"}
                        </SaveBudgetButton>
                    </form>
                </div>
                 {budgetState.message && budgetState.message !== 'success' && (
                    <Alert variant="destructive">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Error al Guardar</AlertTitle>
                      <AlertDescription>
                        {budgetState.message}
                        {budgetState.errors?.services && <div>- {budgetState.errors.services[0]}</div>}
                      </AlertDescription>
                    </Alert>
                )}
            </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
          Anterior
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext}>Siguiente</Button>
        ) : (
          <Button disabled>Finalizar</Button>
        )}
      </div>
    </div>
  )
}

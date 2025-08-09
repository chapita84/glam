
"use client"

import { useActionState, useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { handleGenerateBudget, type BudgetItem } from "@/app/(app)/budgets/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Terminal, Wand2, PartyPopper, Truck, FileText, Loader2, PlusCircle, Trash2, Download } from "lucide-react"
import { BudgetPDF } from "./budget-pdf"
import { PDFDownloadLink } from "@react-pdf/renderer"

const steps = [
  { id: 1, name: "Detalles del Evento", icon: PartyPopper },
  { id: 2, name: "Servicios", icon: Wand2 },
  { id: 3, name: "Logística", icon: Truck },
  { id: 4, name: "Resumen", icon: FileText },
]

type EventDetails = {
    eventType: string;
    eventDate: string;
    eventLocation: string;
}

export function BudgetWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [eventDetails, setEventDetails] = useState<EventDetails>({
      eventType: "Boda",
      eventDate: "",
      eventLocation: "Calle Principal 123, Cualquier Ciudad",
  })
  const [services, setServices] = useState<BudgetItem[]>([]);
  const [logisticsCost, setLogisticsCost] = useState(50);
  const [usdRate, setUsdRate] = useState(900); // Tasa de cambio simulada
  const [isClient, setIsClient] = useState(false)

  // react-pdf/renderer only works on the client, so we need to track this
  useEffect(() => {
    setIsClient(true)
  }, [])


  const [state, formAction] = useActionState(handleGenerateBudget, {
    message: "",
  })

  useEffect(() => {
    if (state.message === 'success' && state.data) {
        setServices(state.data);
    }
  }, [state]);

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
      const parsedValue = typeof value === 'string' && field !== 'name' ? parseFloat(value) : value;
      (newServices[index] as any)[field] = parsedValue;
      setServices(newServices);
  };

  const addService = () => {
      setServices([...services, { name: 'Nuevo Servicio', quantity: 1, price: 0 }]);
  };

  const removeService = (index: number) => {
      setServices(services.filter((_, i) => i !== index));
  };
  
  const servicesTotal = services.reduce((total, service) => total + (service.quantity * service.price), 0);
  const totalUSD = servicesTotal + logisticsCost;
  const totalARS = totalUSD * usdRate;

  const budgetData = {
    ...eventDetails,
    services,
    servicesTotal,
    logisticsCost,
    totalUSD,
    totalARS,
    usdRate,
  }

  const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generar Sugerencias
        </Button>
    )
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
            <div>
              <Label htmlFor="eventDate">Fecha del Evento</Label>
              <Input id="eventDate" type="date" value={eventDetails.eventDate} onChange={handleEventDetailsChange} />
            </div>
            <div>
              <Label htmlFor="eventLocation">Ubicación</Label>
              <Input id="eventLocation" placeholder="p. ej., Calle Principal 123, Cualquier Ciudad" value={eventDetails.eventLocation} onChange={handleEventDetailsChange} />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
             <form action={formAction} className="space-y-4">
                <div>
                  <Label htmlFor="eventTypeDescription">Describe el estilo del evento</Label>
                  <Textarea
                    id="eventTypeDescription"
                    name="eventTypeDescription"
                    placeholder="p. ej., 'Una boda romántica y clásica con un enfoque en la belleza natural.' o 'Una fiesta de 15 años moderna y chic.'"
                    rows={3}
                  />
                  {state.errors?.eventTypeDescription && <p className="text-sm font-medium text-destructive">{state.errors.eventTypeDescription[0]}</p>}
                </div>
                <SubmitButton />
             </form>

              {state.message && state.message !== 'success' && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {state.message}
                  </AlertDescription>
                </Alert>
              )}
             
             <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">Servicio</TableHead>
                            <TableHead>Cantidad</TableHead>
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
                                    <Input type="number" value={service.price} onChange={e => handleServiceChange(index, 'price', e.target.value)} />
                                </TableCell>
                                <TableCell>${(service.quantity * service.price).toFixed(2)}</TableCell>
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
                    Añadir Servicio
                </Button>
             </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="travelCost">Costo de Viaje y Logística (USD)</Label>
              <Input id="travelCost" type="number" placeholder="$" value={logisticsCost} onChange={e => setLogisticsCost(parseFloat(e.target.value) || 0)}/>
            </div>
            <p className="text-sm text-muted-foreground">Introduce cualquier costo de viaje o viáticos asociados con el evento en USD.</p>
          </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-6">
                 <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Resumen del Presupuesto</AlertTitle>
                  <AlertDescription>
                    Revisa los detalles a continuación antes de finalizar el presupuesto. La tasa de cambio utilizada es 1 USD = {usdRate} ARS.
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
                                <span>${(service.quantity * service.price).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-muted-foreground">Subtotal Servicios:</span>
                        <span className="font-medium">${servicesTotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Logística:</span>
                        <span className="font-medium">${logisticsCost.toFixed(2)}</span>
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
                {isClient && (
                  <PDFDownloadLink
                    document={<BudgetPDF data={budgetData} />}
                    fileName={`Presupuesto-${eventDetails.eventType.replace(/\s+/g, '-')}.pdf`}
                  >
                    {({ blob, url, loading, error }) =>
                      loading ? (
                        <Button className="w-full" disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando PDF...
                        </Button>
                      ) : (
                        <Button className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar a PDF
                        </Button>
                      )
                    }
                  </PDFDownloadLink>
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
          <Button disabled>Completar</Button>
        )}
      </div>
    </div>
  )
}

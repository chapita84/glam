"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { handleGenerateBudget } from "@/app/(app)/budgets/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Wand2, PartyPopper, Truck, FileText, Loader2 } from "lucide-react"

const steps = [
  { id: 1, name: "Detalles del Evento", icon: PartyPopper },
  { id: 2, name: "Servicios", icon: Wand2 },
  { id: 3, name: "Logística", icon: Truck },
  { id: 4, name: "Resumen", icon: FileText },
]

export function BudgetWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  
  const [state, formAction] = useFormState(handleGenerateBudget, {
    message: "",
  })

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
    <div className="w-full max-w-3xl mx-auto p-4">
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
              <Input id="eventType" placeholder="p. ej., Boda, Gala Corporativa" />
            </div>
            <div>
              <Label htmlFor="eventDate">Fecha del Evento</Label>
              <Input id="eventDate" type="date" />
            </div>
            <div>
              <Label htmlFor="eventLocation">Ubicación</Label>
              <Input id="eventLocation" placeholder="p. ej., Calle Principal 123, Cualquier Ciudad" />
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
                    rows={4}
                  />
                  {state.errors?.eventTypeDescription && <p className="text-sm font-medium text-destructive">{state.errors.eventTypeDescription[0]}</p>}
                </div>
                <SubmitButton />
             </form>
             {state.message === 'success' && state.data && (
                <Alert>
                  <Wand2 className="h-4 w-4" />
                  <AlertTitle>Sugerencias de IA</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap">
                    {state.data}
                  </AlertDescription>
                </Alert>
             )}
              {state.message === 'Failed to generate budget suggestions.' && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {state.message}
                  </AlertDescription>
                </Alert>
              )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="travelCost">Costo de Viaje</Label>
              <Input id="travelCost" type="number" placeholder="$" />
            </div>
            <p className="text-sm text-muted-foreground">Introduce cualquier costo de viaje o viáticos asociados con el evento.</p>
          </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-6">
                 <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Resumen del Presupuesto</AlertTitle>
                  <AlertDescription>
                    Revisa los detalles a continuación antes de finalizar el presupuesto.
                  </AlertDescription>
                </Alert>
                <div className="p-6 border rounded-lg space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo de Evento:</span>
                        <span className="font-medium">Boda</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Servicios:</span>
                        <span className="font-medium">$1,200.00</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Logística:</span>
                        <span className="font-medium">$50.00</span>
                    </div>
                     <div className="flex justify-between text-lg font-bold border-t pt-4 mt-4">
                        <span>Total (USD):</span>
                        <span>$1,250.00</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total (ARS):</span>
                        <span>$1,125,000.00</span>
                    </div>
                </div>
                 <Button className="w-full">
                    Exportar a PDF y Enviar
                </Button>
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

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
  { id: 1, name: "Event Details", icon: PartyPopper },
  { id: 2, name: "Services", icon: Wand2 },
  { id: 3, name: "Logistics", icon: Truck },
  { id: 4, name: "Summary", icon: FileText },
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
            Generate Suggestions
        </Button>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Progress value={progress} className="mb-8" />
      <div className="mb-8">
        <h2 className="text-2xl font-bold">{steps[currentStep].name}</h2>
        <p className="text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
      </div>

      <div className="space-y-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Input id="eventType" placeholder="e.g., Wedding, Corporate Gala" />
            </div>
            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input id="eventDate" type="date" />
            </div>
            <div>
              <Label htmlFor="eventLocation">Location</Label>
              <Input id="eventLocation" placeholder="e.g., 123 Main St, Anytown" />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
             <form action={formAction} className="space-y-4">
                <div>
                  <Label htmlFor="eventTypeDescription">Describe the event style</Label>
                  <Textarea
                    id="eventTypeDescription"
                    name="eventTypeDescription"
                    placeholder="e.g., 'A romantic and classic wedding with a focus on natural beauty.' or 'A modern and chic 15th birthday party.'"
                    rows={4}
                  />
                  {state.errors?.eventTypeDescription && <p className="text-sm font-medium text-destructive">{state.errors.eventTypeDescription[0]}</p>}
                </div>
                <SubmitButton />
             </form>
             {state.message === 'success' && state.data && (
                <Alert>
                  <Wand2 className="h-4 w-4" />
                  <AlertTitle>AI Suggestions</AlertTitle>
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
              <Label htmlFor="travelCost">Travel Cost</Label>
              <Input id="travelCost" type="number" placeholder="$" />
            </div>
            <p className="text-sm text-muted-foreground">Enter any travel or viatics costs associated with the event.</p>
          </div>
        )}

        {currentStep === 3 && (
            <div className="space-y-6">
                 <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Budget Summary</AlertTitle>
                  <AlertDescription>
                    Review the details below before finalizing the budget.
                  </AlertDescription>
                </Alert>
                <div className="p-6 border rounded-lg space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Event Type:</span>
                        <span className="font-medium">Wedding</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Services:</span>
                        <span className="font-medium">$1,200.00</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Logistics:</span>
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
                    Export to PDF & Send
                </Button>
            </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
          Previous
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button disabled>Complete</Button>
        )}
      </div>
    </div>
  )
}

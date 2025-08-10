
'use server'

import { addOrUpdateBooking, addOrUpdateBudget, type Budget, type EventInfo, type Summary } from '@/lib/firebase/firestore'
import { z } from 'zod'
import { generateBudget } from '@/ai/flows/generate-budget';
import { revalidatePath } from 'next/cache';

const budgetServiceItemSchema = z.object({
  description: z.string(),
  category: z.string().optional().default('Servicio'),
  quantity: z.coerce.number(),
  unitCost: z.object({
      amount: z.coerce.number(),
      currency: z.string().default('USD')
  }),
  duration: z.coerce.number().optional().default(0), // duration per unit in minutes
});

export type BudgetServiceItem = z.infer<typeof budgetServiceItemSchema>;

const budgetSchema = z.object({
  id: z.string().optional(),
  clientName: z.string().min(1, "El nombre del cliente es requerido."),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']),
  
  // Event Info
  eventType: z.string().min(1, "El tipo de evento es requerido."),
  eventDate: z.string().min(1, "La fecha del evento es requerida."),
  eventTime: z.string().optional(),
  eventLocation: z.string().min(1, "La ubicación es requerida."),
  
  // Items
  items: z.string(), // JSON string of BudgetServiceItem[]

  // Summary
  logisticsCost: z.coerce.number(),
  usdRate: z.coerce.number(),
  tenantId: z.string(),
})

export type BudgetItem = {
  description: string;
  category?: string;
  quantity: number;
  unitCost: {
    amount: number;
    currency: string;
  };
  duration?: number;
}

export type AIGenerationFormState = {
  message: string;
  data?: BudgetItem[];
  errors?: {
    eventTypeDescription?: string[];
  }
}

export type BudgetFormState = {
    message: string;
    errors?: {
        clientName?: string[];
        eventType?: string[];
        eventDate?: string[];
        eventLocation?: string[];
        items?: string[];
    }
}


export async function handleGenerateBudget(prevState: AIGenerationFormState, formData: FormData): Promise<AIGenerationFormState> {
  const validatedFields = z.object({
      eventTypeDescription: z.string().min(10, "Por favor, proporciona una descripción más detallada (al menos 10 caracteres)."),
  }).safeParse({
    eventTypeDescription: formData.get('eventTypeDescription'),
  })

  if (!validatedFields.success) {
    return {
      message: 'Datos de formulario no válidos.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  try {
    const result = await generateBudget({
      eventTypeDescription: validatedFields.data.eventTypeDescription,
    });
    // Adapt AI response to the new BudgetItem structure
    const budgetItems: BudgetItem[] = result.suggestedServices.map(s => ({
        description: s.name,
        quantity: s.quantity,
        unitCost: { amount: s.price, currency: 'USD' },
        duration: 60, // Default duration
        category: 'Sugerencia IA'
    }));
    return { message: 'success', data: budgetItems };
  } catch (error) {
    console.error(error);
    return { message: 'No se pudieron generar las sugerencias de presupuesto.' };
  }
}

export async function handleSaveBudget(prevState: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
    const validatedFields = budgetSchema.safeParse({
        id: formData.get('id'),
        clientName: formData.get('clientName'),
        status: formData.get('status'),
        eventType: formData.get('eventType'),
        eventDate: formData.get('eventDate'),
        eventTime: formData.get('eventTime'),
        eventLocation: formData.get('eventLocation'),
        items: formData.get('items'),
        logisticsCost: formData.get('logisticsCost'),
        usdRate: formData.get('usdRate'),
        tenantId: formData.get('tenantId'),
    });

    if (!validatedFields.success) {
        return {
            message: "Datos de formulario no válidos.",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        const items = z.array(budgetServiceItemSchema).parse(JSON.parse(validatedFields.data.items));
        
        const servicesSubtotal = items.reduce((total, item) => total + (item.quantity * item.unitCost.amount), 0);
        const totalDuration = items.reduce((total, item) => total + (item.duration || 0) * item.quantity, 0);

        const eventInfo: EventInfo = {
            type: validatedFields.data.eventType,
            date: validatedFields.data.eventDate,
            time: validatedFields.data.eventTime || "",
            location: validatedFields.data.eventLocation,
        };

        const summary: Summary = {
            subtotal: servicesSubtotal,
            logistics: validatedFields.data.logisticsCost,
            totalUSD: servicesSubtotal + validatedFields.data.logisticsCost,
            exchangeRate: validatedFields.data.usdRate,
            totalARS: (servicesSubtotal + validatedFields.data.logisticsCost) * validatedFields.data.usdRate,
        };

        const budget: Budget = {
            id: validatedFields.data.id,
            budgetName: `Presupuesto ${validatedFields.data.eventType} - ${validatedFields.data.clientName}`,
            clientName: validatedFields.data.clientName,
            status: validatedFields.data.status,
            eventInfo,
            items,
            summary,
            totalDuration, // Store for booking creation
        }

        const budgetId = await addOrUpdateBudget(validatedFields.data.tenantId, budget);
        
        // If the budget is approved, create a booking
        if (budget.status === 'approved' && budget.eventInfo.date && budget.eventInfo.time) {
            const [hours, minutes] = budget.eventInfo.time.split(':').map(Number);
            const startTime = new Date(budget.eventInfo.date);
            startTime.setUTCHours(hours, minutes);

            await addOrUpdateBooking(validatedFields.data.tenantId, {
                // The booking ID will be the same as the budget ID for easy reference
                id: budgetId,
                clientName: `Evento: ${budget.eventInfo.type} (${budget.clientName})`,
                clientId: 'event-client',
                staffId: 'any-staff', // Or assign to a specific "Events" staff member
                staffName: "Equipo de Eventos",
                serviceId: 'event-service',
                serviceName: `${budget.items.length} servicios`,
                duration: budget.totalDuration || 120, // Use calculated duration
                startTime: startTime,
                status: 'confirmed',
                price: {
                    amount: budget.summary.totalUSD,
                    currency: 'USD',
                },
                notes: `Presupuesto #${budgetId} aprobado para ${budget.eventInfo.type} en ${budget.eventInfo.location}.`,
            });
             revalidatePath('/(app)/appointments');
        }
        
        revalidatePath('/(app)/budgets');
        return { message: 'success' };

    } catch(error) {
        console.error(error);
        if (error instanceof z.ZodError) {
             return { message: "Los datos de los servicios no son válidos.", errors: { items: error.flatten().fieldErrors._errors } };
        }
        return { message: 'No se pudo guardar el presupuesto.' };
    }
}

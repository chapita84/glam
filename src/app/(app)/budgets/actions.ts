
'use server'

import { addOrUpdateBooking, addOrUpdateBudget, type Budget } from '@/lib/firebase/firestore'
import { z } from 'zod'
import { generateBudget } from '@/ai/flows/generate-budget';
import { revalidatePath } from 'next/cache';

const budgetServicesSchema = z.array(z.object({
  name: z.string(),
  quantity: z.coerce.number(),
  price: z.coerce.number(),
  duration: z.coerce.number().optional().default(0),
}));

const budgetSchema = z.object({
  id: z.string().optional(),
  eventType: z.string().min(1, "El tipo de evento es requerido."),
  eventDate: z.string().min(1, "La fecha del evento es requerida."),
  eventTime: z.string().optional(),
  eventLocation: z.string().min(1, "La ubicación es requerida."),
  services: z.string(), // JSON string
  logisticsCost: z.coerce.number(),
  usdRate: z.coerce.number(),
  status: z.enum(['in_preparation', 'sent', 'confirmed', 'rejected']),
  tenantId: z.string(),
})

export type BudgetItem = {
  name: string;
  quantity: number;
  price: number;
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
        eventType?: string[];
        eventDate?: string[];
        eventLocation?: string[];
        services?: string[];
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
    // Add a default duration to AI suggested services
    const servicesWithDuration = result.suggestedServices.map(s => ({...s, duration: 60 }));
    return { message: 'success', data: servicesWithDuration };
  } catch (error) {
    console.error(error);
    return { message: 'No se pudieron generar las sugerencias de presupuesto.' };
  }
}

export async function handleSaveBudget(prevState: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
    const validatedFields = budgetSchema.safeParse({
        id: formData.get('id'),
        eventType: formData.get('eventType'),
        eventDate: formData.get('eventDate'),
        eventTime: formData.get('eventTime'),
        eventLocation: formData.get('eventLocation'),
        services: formData.get('services'),
        logisticsCost: formData.get('logisticsCost'),
        usdRate: formData.get('usdRate'),
        status: formData.get('status'),
        tenantId: formData.get('tenantId'),
    });

    if (!validatedFields.success) {
        return {
            message: "Datos de formulario no válidos.",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        const services = budgetServicesSchema.parse(JSON.parse(validatedFields.data.services));
        
        const servicesTotal = services.reduce((total, service) => total + (service.quantity * service.price), 0);
        const totalDuration = services.reduce((total, service) => total + (service.duration || 0) * service.quantity, 0);

        const budget: Budget = {
            id: validatedFields.data.id,
            ...validatedFields.data,
            services,
            totalDuration,
            totalUSD: servicesTotal + validatedFields.data.logisticsCost,
        }

        const budgetId = await addOrUpdateBudget(validatedFields.data.tenantId, budget);
        
        // If the budget is confirmed, create a booking
        if (budget.status === 'confirmed' && budget.eventDate && budget.eventTime) {
            const [hours, minutes] = budget.eventTime.split(':').map(Number);
            const startTime = new Date(budget.eventDate);
            startTime.setUTCHours(hours, minutes);

            await addOrUpdateBooking(validatedFields.data.tenantId, {
                // The booking ID will be the same as the budget ID for easy reference
                id: budgetId,
                clientName: `Evento: ${budget.eventType}`,
                clientId: 'event-client',
                staffId: 'any-staff', // Or assign to a specific "Events" staff member
                staffName: "Equipo de Eventos",
                serviceId: 'event-service',
                serviceName: `${budget.services.length} servicios`,
                duration: budget.totalDuration,
                startTime: startTime,
                status: 'confirmed',
                price: {
                    amount: budget.totalUSD,
                    currency: 'USD',
                },
                notes: `Presupuesto confirmado para ${budget.eventType} en ${budget.eventLocation}.`,
            });
             revalidatePath('/(app)/appointments');
        }
        
        revalidatePath('/(app)/budgets');
        return { message: 'success' };

    } catch(error) {
        console.error(error);
        if (error instanceof z.ZodError) {
             return { message: "Los datos de los servicios no son válidos.", errors: { services: error.flatten().fieldErrors._errors } };
        }
        return { message: 'No se pudo guardar el presupuesto.' };
    }
}

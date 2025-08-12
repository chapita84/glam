
'use server'

import { addOrUpdateBudget, type Budget } from '@/lib/firebase/firestore'
import { z } from 'zod'
import { generateBudget } from '@/ai/flows/generate-budget';
import { revalidatePath } from 'next/cache';

// Type definitions, assuming they are defined elsewhere and imported
export type BudgetItem = {
  description: string;
  category: string;
  quantity: number;
  unitCost: {
    amount: number;
    currency: 'USD' | 'ARS';
  };
  duration?: number;
};

export type EventInfo = {
  type: string;
  date: string;
  time: string;
  location: string;
};

export type Summary = {
    subtotal: number;
    logistics: number;
    totalUSD: number;
    exchangeRate: number;
    totalARS: number;
};


// Zod Schemas for validation
const budgetItemSchema = z.object({
    description: z.string().min(1, "La descripción es obligatoria."),
    category: z.string().min(1, "La categoría es obligatoria."),
    quantity: z.number().min(1, "La cantidad debe ser al menos 1."),
    unitCost: z.object({
        amount: z.number().min(0, "El costo unitario no puede ser negativo."),
        currency: z.enum(['USD', 'ARS']),
    }),
    duration: z.number().optional(),
});

const budgetSchema = z.object({
  budgetName: z.string().min(3, "El nombre del presupuesto es obligatorio."),
  clientName: z.string().min(1, "El nombre del cliente es obligatorio."),
  eventInfo: z.object({
    type: z.string().min(1, "El tipo de evento es obligatorio."),
    date: z.string().min(1, "La fecha es obligatoria."),
    time: z.string().min(1, "La hora es obligatoria."),
    location: z.string().min(1, "La ubicación es obligatoria."),
  }),
  items: z.array(budgetItemSchema),
  summary: z.object({
      subtotal: z.number(),
      logistics: z.number(),
      totalUSD: z.number(),
      exchangeRate: z.number(),
      totalARS: z.number(),
  })
});

// Form states
type AIFormState = {
  message: string;
  errors?: {
    eventTypeDescription?: string[];
  }
  data?: BudgetItem[];
}

type BudgetFormState = {
    message: string;
    errors?: any;
}

// Mock data for fallback
const mockItems: BudgetItem[] = [
    { description: "Maquillaje de Novia (Ejemplo)", category: "Maquillaje", quantity: 1, unitCost: { amount: 250, currency: 'USD' }, duration: 120 },
    { description: "Peinado de Novia (Ejemplo)", category: "Peluquería", quantity: 1, unitCost: { amount: 200, currency: 'USD' }, duration: 90 },
    { description: "Manicura y Pedicura (Ejemplo)", category: "Uñas", quantity: 1, unitCost: { amount: 80, currency: 'USD' }, duration: 60 },
];


export async function handleAIGeneration(prevState: AIFormState, formData: FormData): Promise<AIFormState> {
    const eventTypeDescription = formData.get('eventTypeDescription') as string;
    if (!eventTypeDescription || eventTypeDescription.trim().length < 10) {
        return {
            message: "Por favor, proporciona una descripción más detallada (mínimo 10 caracteres).",
            errors: { eventTypeDescription: ["La descripción es demasiado corta."] }
        }
    }

    try {
        console.log("Attempting to call Genkit AI flow...");
        const result = await generateBudget(eventTypeDescription);
        const budgetItems = result.items as BudgetItem[];
        console.log("AI flow executed successfully.");
        return { message: "success", data: budgetItems };
    } catch (error: any) {
        console.error("Genkit AI flow failed:", error);
        // Fallback to mock data if AI generation fails
        return {
            message: "success",
            data: mockItems
        };
    }
}


export async function handleSaveBudget(studioId: string, prevState: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
    if(!studioId) return { message: "Error: ID de estudio no encontrado." };

    const budgetData = {
        id: formData.get('id') as string,
        budgetName: formData.get('budgetName') as string,
        clientName: formData.get('clientName') as string,
        status: formData.get('status') as 'draft' | 'sent' | 'approved' | 'rejected',
        eventInfo: JSON.parse(formData.get('eventInfo') as string),
        items: JSON.parse(formData.get('items') as string),
        summary: JSON.parse(formData.get('summary') as string),
    }
    
    const validatedFields = budgetSchema.safeParse(budgetData);

    if(!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors);
        return {
            message: "Datos de formulario no válidos.",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        await addOrUpdateBudget(studioId, validatedFields.data);
        revalidatePath('/budgets');
        return { message: "success" };
    } catch(error) {
        console.error(error);
        return { message: "Error al guardar el presupuesto." };
    }
}

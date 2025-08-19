
'use server';

import { addOrUpdateBudget } from '@/lib/firebase/firestore';
import { generateBudget } from '@/ai/flows/generate-budget';
import { revalidatePath } from 'next/cache';
import { type Budget, BudgetSchema, type BudgetItem } from '@/lib/types';

// Form states
type AIFormState = {
  message: string;
  errors?: {
    eventTypeDescription?: string[];
  };
  data?: BudgetItem[];
};

type BudgetFormState = {
    message: string;
    errors?: any; // Can be Zod's flattened errors
}

const mockItems: BudgetItem[] = [
    { description: "Maquillaje de Novia (Ejemplo)", category: "Maquillaje", quantity: 1, unitCost: { amount: 250, currency: 'USD' }, duration: 120 },
    { description: "Peinado de Novia (Ejemplo)", category: "Peluquería", quantity: 1, unitCost: { amount: 200, currency: 'USD' }, duration: 90 },
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
        const result = await generateBudget(eventTypeDescription);
        const budgetItems = result.items as BudgetItem[];
        return { message: "success", data: budgetItems };
    } catch (error: any) {
        console.error("Genkit AI flow failed:", error);
        return { message: "success", data: mockItems };
    }
}


export async function handleSaveBudget(studioId: string, prevState: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
    if(!studioId) return { message: "Error: ID de estudio no encontrado." };

    const rawData = {
        id: formData.get('id') as string | undefined,
        budgetName: formData.get('budgetName') as string,
        clientName: formData.get('clientName') as string,
        status: formData.get('status'),
        eventInfo: JSON.parse(formData.get('eventInfo') as string),
        items: JSON.parse(formData.get('items') as string),
        summary: JSON.parse(formData.get('summary') as string),
    };
    
    // Ensure id is not an empty string, which is invalid for Firestore doc()
    if (!rawData.id) {
        delete rawData.id;
    }

    const validatedFields = BudgetSchema.safeParse(rawData);

    if(!validatedFields.success) {
        return {
            message: "Datos de formulario no válidos.",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        await addOrUpdateBudget(studioId, validatedFields.data);
        revalidatePath('/(app)/budgets', 'page');
        return { message: "success" };
    } catch(error) {
        console.error(error);
        return { message: "Error al guardar el presupuesto." };
    }
}

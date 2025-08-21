
'use server';

import { addOrUpdateBudget } from '@/lib/firebase/firestore';
import { generateBudget } from '@/ai/flows/generate-budget';
import { revalidatePath } from 'next/cache';
import { type Budget, BudgetSchema, type BudgetItem } from '@/lib/types';
import { adminDb } from '@/lib/firebase/admin';

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
        const result = await generateBudget({ eventTypeDescription });
        const budgetItems = result.suggestedServices.map(service => ({
            description: service.name,
            category: 'Service',
            quantity: service.quantity,
            unitCost: {
                amount: service.price,
                currency: 'USD' as const
            }
        })) as BudgetItem[];
        return { message: "success", data: budgetItems };
    } catch (error: any) {
        console.error("Genkit AI flow failed:", error);
        return { message: "success", data: mockItems };
    }
}


export async function handleSaveBudget(studioId: string, prevState: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
    if(!studioId) return { message: "Error: ID de estudio no encontrado." };

    console.log('=== DEBUG SAVE BUDGET ===');
    console.log('studioId:', studioId);
    
    // Verificar el contexto de autenticación del servidor
    const { headers } = await import('next/headers');
    console.log('Request headers available:', Object.keys(headers()));
    
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    const rawData = {
        id: formData.get('id') as string | undefined,
        budgetName: formData.get('budgetName') as string,
        clientName: formData.get('clientName') as string,
        status: formData.get('status'),
        eventInfo: JSON.parse(formData.get('eventInfo') as string),
        items: JSON.parse(formData.get('items') as string),
        summary: JSON.parse(formData.get('summary') as string),
    };
    
    console.log('Parsed rawData:', JSON.stringify(rawData, null, 2));
    
    console.log('Parsed rawData:', JSON.stringify(rawData, null, 2));
    
    // Ensure id is not an empty string, which is invalid for Firestore doc()
    if (!rawData.id) {
        delete rawData.id;
    }

    console.log('Data after id cleanup:', JSON.stringify(rawData, null, 2));

    const validatedFields = BudgetSchema.safeParse(rawData);

    console.log('Validation result:', validatedFields.success);
    if(!validatedFields.success) {
        console.log('Validation errors:', JSON.stringify(validatedFields.error.flatten(), null, 2));
        console.log('Validation errors DETAILS:', JSON.stringify(validatedFields.error.errors, null, 2));
        return {
            message: "Datos de formulario no válidos.",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        console.log('Attempting to save budget with data:', JSON.stringify(validatedFields.data, null, 2));
        console.log('Calling Admin SDK to save budget in studioId:', studioId);
        
        // Usar Admin SDK para escribir desde el servidor
        try {
            const budgetsCollection = adminDb.collection('studios').doc(studioId).collection('budgets');
            const docRef = await budgetsCollection.add(validatedFields.data);
            console.log('Budget saved successfully with Admin SDK, ID:', docRef.id);
        } catch (adminError) {
            console.log('Admin SDK failed, falling back to client SDK:', adminError);
            // Fallback al método anterior
            await addOrUpdateBudget(studioId, validatedFields.data);
            console.log('Budget saved successfully with client SDK fallback');
        }
        
        revalidatePath('/(app)/budgets', 'page');
        console.log('Budget saved successfully');
        return { message: "Presupuesto guardado exitosamente." };
    } catch(error: any) {
        console.error('Error saving budget:', error);
        console.error('Error details:', {
            name: error?.name,
            message: error?.message,
            code: error?.code,
            stack: error?.stack
        });
        return { message: `Error al guardar el presupuesto: ${error?.message || 'Error desconocido'}` };
    }
}

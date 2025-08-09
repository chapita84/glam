'use server'

import { generateBudget } from '@/ai/flows/generate-budget'
import { z } from 'zod'

const budgetSchema = z.object({
  eventTypeDescription: z.string().min(10, "Por favor, proporciona una descripción más detallada (al menos 10 caracteres)."),
})

export type BudgetItem = {
  name: string;
  quantity: number;
  price: number;
}

type FormState = {
  message: string;
  data?: BudgetItem[];
  errors?: {
    eventTypeDescription?: string[];
  }
}

export async function handleGenerateBudget(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = budgetSchema.safeParse({
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
    return { message: 'success', data: result.suggestedServices };
  } catch (error) {
    console.error(error);
    return { message: 'No se pudieron generar las sugerencias de presupuesto.' };
  }
}

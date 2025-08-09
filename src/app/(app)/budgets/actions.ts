'use server'

import { generateBudget } from '@/ai/flows/generate-budget'
import { z } from 'zod'

const budgetSchema = z.object({
  eventTypeDescription: z.string().min(10, "Please provide a more detailed description (at least 10 characters)."),
})

type FormState = {
  message: string;
  data?: string;
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
      message: 'Invalid form data.',
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
    return { message: 'Failed to generate budget suggestions.' };
  }
}

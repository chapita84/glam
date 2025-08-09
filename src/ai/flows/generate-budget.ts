// This file uses server-side code.
'use server';

/**
 * @fileOverview A smart budget tool that uses GenAI to suggest the initial service and pricing configuration based on a description of the event type.
 *
 * - generateBudget - A function that generates a budget based on a description of the event type.
 * - GenerateBudgetInput - The input type for the generateBudget function.
 * - GenerateBudgetOutput - The return type for the generateBudget function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBudgetInputSchema = z.object({
  eventTypeDescription: z
    .string()
    .describe('Una descripción del tipo de evento para el cual generar un presupuesto.'),
});
export type GenerateBudgetInput = z.infer<typeof GenerateBudgetInputSchema>;

const BudgetItemSchema = z.object({
    name: z.string().describe('El nombre del servicio o ítem del presupuesto.'),
    quantity: z.number().describe('La cantidad de este servicio.'),
    price: z.number().describe('El precio unitario de este servicio.'),
});

const GenerateBudgetOutputSchema = z.object({
  suggestedServices: z.array(BudgetItemSchema)
    .describe(
      'Una lista de objetos de servicio sugeridos, cada uno con nombre, cantidad y precio, basada en la descripción del tipo de evento.'
    ),
});
export type GenerateBudgetOutput = z.infer<typeof GenerateBudgetOutputSchema>;

export async function generateBudget(input: GenerateBudgetInput): Promise<GenerateBudgetOutput> {
  return generateBudgetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBudgetPrompt',
  input: {schema: GenerateBudgetInputSchema},
  output: {schema: GenerateBudgetOutputSchema},
  prompt: `Eres un asistente de IA que ayuda a los propietarios de salones de belleza a generar presupuestos para sus eventos.

  Basado en la descripción del tipo de evento, sugiere una lista de servicios y configuración de precios. Asegúrate de devolver un array de objetos de servicio.

  Descripción del Tipo de Evento: {{{eventTypeDescription}}}
  `,
});

const generateBudgetFlow = ai.defineFlow(
  {
    name: 'generateBudgetFlow',
    inputSchema: GenerateBudgetInputSchema,
    outputSchema: GenerateBudgetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

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
    .describe('A description of the event type for which to generate a budget.'),
});
export type GenerateBudgetInput = z.infer<typeof GenerateBudgetInputSchema>;

const GenerateBudgetOutputSchema = z.object({
  suggestedServices: z
    .string()
    .describe(
      'A list of suggested services and pricing configuration based on the event type description.'
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
  prompt: `You are an AI assistant helping tenant owners generate budgets for their events.

  Based on the event type description, suggest a list of services and pricing configuration.

  Event Type Description: {{{eventTypeDescription}}}
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

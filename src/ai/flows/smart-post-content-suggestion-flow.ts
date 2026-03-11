'use server';
/**
 * @fileOverview A Genkit flow for suggesting relevant phrases or keywords
 *               based on post type and user location.
 *
 * - smartPostContentSuggestion - A function that handles content suggestion.
 * - SmartPostContentSuggestionInput - The input type for the function.
 * - SmartPostContentSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartPostContentSuggestionInputSchema = z.object({
  postType: z.string().describe('The type of post (Ajuda, SOS, Partilha, Evento).'),
  userLocation: z
    .string()
    .describe('The user\u0027s location (e.g., \"Lisboa, Bairro Alto\").'),
});
export type SmartPostContentSuggestionInput = z.infer<
  typeof SmartPostContentSuggestionInputSchema
>;

const SmartPostContentSuggestionOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of suggested phrases or keywords.'),
});
export type SmartPostContentSuggestionOutput = z.infer<
  typeof SmartPostContentSuggestionOutputSchema
>;

export async function smartPostContentSuggestion(
  input: SmartPostContentSuggestionInput
): Promise<SmartPostContentSuggestionOutput> {
  return smartPostContentSuggestionFlow(input);
}

const smartPostContentSuggestionPrompt = ai.definePrompt({
  name: 'smartPostContentSuggestionPrompt',
  input: {schema: SmartPostContentSuggestionInputSchema},
  output: {schema: SmartPostContentSuggestionOutputSchema},
  prompt: `Generate a list of 3-5 relevant phrases or keywords for a new post of type '{{{postType}}}' in the location '{{{userLocation}}}'.

Examples:
If postType is 'Ajuda' and userLocation is 'Porto, Cedofeita':
- Preciso de ajuda urgente para mudar um móvel pesado em Cedofeita.
- Alguém disponível para dar uma mão aqui no Porto?
- Ajuda com transporte de pequeno volume na zona da Foz.

If postType is 'Evento' and userLocation is 'Lisboa, Bairro Alto':
- Evento cultural no Bairro Alto este fim de semana.
- Encontro de voluntários para limpeza do bairro.
- Celebração de Santo António, quem vem?

Provide the suggestions in Portuguese and ensure they are practical and directly related to the post type and location.
Return only the JSON array of strings, without any additional text.`,
});

const smartPostContentSuggestionFlow = ai.defineFlow(
  {
    name: 'smartPostContentSuggestionFlow',
    inputSchema: SmartPostContentSuggestionInputSchema,
    outputSchema: SmartPostContentSuggestionOutputSchema,
  },
  async (input) => {
    const {output} = await smartPostContentSuggestionPrompt(input);
    return output!;
  }
);

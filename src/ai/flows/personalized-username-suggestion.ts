'use server';
/**
 * @fileOverview This file provides a Genkit flow for generating personalized username suggestions.
 *
 * - generatePersonalizedUsernameSuggestion - A function that suggests unique and creative usernames
 *   based on the user's name and optional district, along with intelligent alternatives.
 * - PersonalizedUsernameSuggestionInput - The input type for the generatePersonalizedUsernameSuggestion function.
 * - PersonalizedUsernameSuggestionOutput - The return type for the generatePersonalizedUsernameSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedUsernameSuggestionInputSchema = z.object({
  fullName: z.string().describe('O nome completo do utilizador.'),
  district: z.string().optional().describe('O distrito do utilizador em Portugal (opcional).'),
});
export type PersonalizedUsernameSuggestionInput = z.infer<typeof PersonalizedUsernameSuggestionInputSchema>;

const PersonalizedUsernameSuggestionOutputSchema = z.object({
  suggestedUsername: z.string().describe('O username principal sugerido pelo sistema. Deve começar com "@" e ser em minúsculas (ex: @ricardo_lisboa).'),
  alternativeUsernames: z.array(z.string()).describe('Uma lista de 3 a 5 usernames alternativos, criativos e únicos, começando com "@" e em minúsculas, caso o principal esteja em uso ou para inspiração.'),
});
export type PersonalizedUsernameSuggestionOutput = z.infer<typeof PersonalizedUsernameSuggestionOutputSchema>;

export async function generatePersonalizedUsernameSuggestion(
  input: PersonalizedUsernameSuggestionInput
): Promise<PersonalizedUsernameSuggestionOutput> {
  return personalizedUsernameSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedUsernameSuggestionPrompt',
  input: {schema: PersonalizedUsernameSuggestionInputSchema},
  output: {schema: PersonalizedUsernameSuggestionOutputSchema},
  prompt: `Gera um '@username' criativo e único para um novo utilizador, baseado no nome completo '{{{fullName}}}' e, se disponível, no distrito '{{{district}}}'.
  
  O username principal deve ser fácil de lembrar, ter um toque português se possível, e seguir o formato '@nome'. Deve começar com '@' e ser em minúsculas.
  
  Além disso, sugere entre 3 a 5 alternativas inteligentes, criativas e únicas, que também comecem com '@' e sejam em minúsculas, caso o principal sugerido não esteja disponível ou para que o utilizador tenha mais opções de escolha. Evita apenas adicionar números sequenciais; tenta variações mais inteligentes.`,
});

const personalizedUsernameSuggestionFlow = ai.defineFlow(
  {
    name: 'personalizedUsernameSuggestionFlow',
    inputSchema: PersonalizedUsernameSuggestionInputSchema,
    outputSchema: PersonalizedUsernameSuggestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate username suggestions.');
    }
    return output;
  }
);

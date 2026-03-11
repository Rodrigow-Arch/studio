'use server';
/**
 * @fileOverview A Genkit flow for generating personal bio descriptions.
 *
 * - generateBioDescription - A function that handles the bio description generation process.
 * - BioDescriptionGenerationInput - The input type for the generateBioDescription function.
 * - BioDescriptionGenerationOutput - The return type for the generateBioDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BioDescriptionGenerationInputSchema = z.object({
  name: z.string().describe('The full name of the user.'),
  district: z.string().describe('The district where the user is located in Portugal.'),
  zone: z.string().optional().describe('The specific zone or neighborhood within the district (optional).'),
});
export type BioDescriptionGenerationInput = z.infer<typeof BioDescriptionGenerationInputSchema>;

const BioDescriptionGenerationOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggested personal bio descriptions.'),
});
export type BioDescriptionGenerationOutput = z.infer<typeof BioDescriptionGenerationOutputSchema>;

export async function generateBioDescription(input: BioDescriptionGenerationInput): Promise<BioDescriptionGenerationOutput> {
  return bioDescriptionGenerationFlow(input);
}

const bioDescriptionPrompt = ai.definePrompt({
  name: 'bioDescriptionPrompt',
  input: { schema: BioDescriptionGenerationInputSchema },
  output: { schema: BioDescriptionGenerationOutputSchema },
  prompt: `You are an AI assistant that helps users of "Portugal Unido" social network create engaging personal bios.
Based on the user's name and location, suggest 3-5 concise and appealing personal bio options that they can use as a starting point for their profile. The bios should be in Portuguese and reflect a community-oriented spirit for the "Portugal Unido" platform.

User Information:
Name: {{{name}}}
District: {{{district}}}
{{#if zone}}Zone/Neighborhood: {{{zone}}}{{/if}}

Generate the suggestions in a JSON array format. Each suggestion should be a string.

Example Output: {"suggestions":["Olá! Sou [Name] de [District] e adoro ajudar a minha comunidade. Contem comigo!", "Membro ativo de [District], [Name] está aqui para conectar e colaborar com vizinhos."]}`,
});

const bioDescriptionGenerationFlow = ai.defineFlow(
  {
    name: 'bioDescriptionGenerationFlow',
    inputSchema: BioDescriptionGenerationInputSchema,
    outputSchema: BioDescriptionGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await bioDescriptionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate bio descriptions.');
    }
    return output;
  }
);

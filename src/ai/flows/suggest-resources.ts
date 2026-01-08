
'use server';

/**
 * @fileOverview Suggests relevant websites and YouTube channels to learn missing skills.
 *
 * - suggestResources - A function that suggests learning resources for missing skills.
 * - SuggestResourcesInput - The input type for the suggestResources function.
 * - SuggestResourcesOutput - The return type for the suggestResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResourcesInputSchema = z.object({
  missingSkills: z
    .array(z.string())
    .describe('An array of skills the user is lacking.'),
});
export type SuggestResourcesInput = z.infer<typeof SuggestResourcesInputSchema>;

const SuggestResourcesOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      skill: z.string().describe('The skill the suggestion is for.'),
      websites: z.array(z.string()).describe('A list of suggested website URLs for learning the skill.'),
      youtubeChannels: z
        .array(z.string())
        .describe('Suggested YouTube channels for learning the skill.'),
    })
  ),
});
export type SuggestResourcesOutput = z.infer<typeof SuggestResourcesOutputSchema>;

export async function suggestResources(input: SuggestResourcesInput): Promise<SuggestResourcesOutput> {
  return suggestResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResourcesPrompt',
  input: {schema: SuggestResourcesInputSchema},
  output: {schema: SuggestResourcesOutputSchema},
  prompt: `You are an AI assistant that suggests websites and YouTube channels for learning specific skills.

  For each of the following skills, suggest one or two relevant, high-quality websites and one or two popular YouTube channels. Provide full URLs for websites (e.g., https://www.example.com).

  Skills:
  {{#each missingSkills}}- {{this}}\n{{/each}}`,
});

const suggestResourcesFlow = ai.defineFlow(
  {
    name: 'suggestResourcesFlow',
    inputSchema: SuggestResourcesInputSchema,
    outputSchema: SuggestResourcesOutputSchema,
  },
  async input => {
    if (!input.missingSkills || input.missingSkills.length === 0) {
      return { suggestions: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);

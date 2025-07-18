'use server';

/**
 * @fileOverview Generates a list of major technical skills for a given job role and experience level.
 *
 * - getTechnicalSkills - A function that handles the technical skill generation process.
 * - GetTechnicalSkillsInput - The input type for the getTechnicalSkills function.
 * - GetTechnicalSkillsOutput - The return type for the getTechnicalSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const gemini15flash = googleAI.model('gemini-1.5-flash');

const GetTechnicalSkillsInputSchema = z.object({
  role: z.string().describe('The job title or role (e.g., "Software Engineer").'),
  experience: z.string().describe('The desired experience level (e.g., "Entry-level", "Mid-level", "Senior").'),
});
export type GetTechnicalSkillsInput = z.infer<typeof GetTechnicalSkillsInputSchema>;

const GetTechnicalSkillsOutputSchema = z.object({
  technicalSkills: z.array(z.string()).describe("A list of essential technical skills for the role."),
});
export type GetTechnicalSkillsOutput = z.infer<typeof GetTechnicalSkillsOutputSchema>;


export async function getTechnicalSkills(input: GetTechnicalSkillsInput): Promise<GetTechnicalSkillsOutput> {
  return getTechnicalSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getTechnicalSkillsPrompt',
  input: {schema: GetTechnicalSkillsInputSchema},
  output: {schema: GetTechnicalSkillsOutputSchema},
  model: gemini15flash,
  prompt: `
  **CRITICAL INSTRUCTION: Your entire response must be based *only* on the user-provided 'Job Role' and 'Experience Level'.**

  **Job Role:** {{role}}
  **Experience Level:** {{experience}}

  Generate a list of the most important and relevant **technical skills** required for this specific job role and experience level.
  Focus only on technologies, programming languages, frameworks, tools, and core technical concepts.
  Do NOT include soft skills like "communication" or "teamwork".
  `,
});


const getTechnicalSkillsFlow = ai.defineFlow(
  {
    name: 'getTechnicalSkillsFlow',
    inputSchema: GetTechnicalSkillsInputSchema,
    outputSchema: GetTechnicalSkillsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("Failed to generate technical skills from AI.");
    }

    return output;
  }
);

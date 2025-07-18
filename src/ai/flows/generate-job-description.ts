'use server';

/**
 * @fileOverview Generates a detailed job description based on a role and experience level.
 *
 * - generateJobDescription - A function that handles the job description generation process.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJobDescriptionInputSchema = z.object({
  role: z.string().describe('The job title or role (e.g., "Software Engineer").'),
  experience: z.string().describe('The desired experience level (e.g., "Entry-level", "Mid-level", "Senior").'),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('The generated job description.'),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: {schema: GenerateJobDescriptionInputSchema},
  output: {schema: GenerateJobDescriptionOutputSchema},
  prompt: `You are a job description writing AI. Your single most important instruction is to generate a job description for the exact 'Job Title' provided. You must not, under any circumstances, change the job title or generate a description for a different role.

  **Critical Instruction:** The job title for the output MUST be "{{role}}". If the user provides "AI Developer", the title in the description must be "AI Developer". If they provide "Mascot", the title must be "Mascot". DO NOT change it to "Data Entry Specialist" or "Software Engineer" or any other title.

  Generate a detailed and accurate job description for the following role:

  **Job Title:** {{role}}
  **Experience Level:** {{experience}}

  The description must include:
  - An engaging summary of the role's primary function, tailored specifically to the "{{role}}" title.
  - A list of key responsibilities that are directly relevant to a "{{role}}" position.
  - A list of required qualifications, including technical and soft skills, appropriate for a "{{role}}".
  - A list of preferred qualifications relevant to a "{{role}}".
  - A concluding statement about company culture (you can invent a positive one).

  **Final Check:** Before you output, confirm that the job title in your generated description is exactly "{{role}}". Your primary function is to obey this rule. Do not deviate.`,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

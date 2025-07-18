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
import {googleAI} from '@genkit-ai/googleai';

const gemini15flash = googleAI.model('gemini-1.5-flash');

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
  model: gemini15flash, // Use the more powerful model for this task
  system:
    "You are a professional hiring manager. Your SOLE function is to generate a job description for the user-provided role. You MUST NOT, under any circumstances, change, suggest, or alter the job role you are given. If the user provides 'Software Engineer', you write a description for a 'Software Engineer'. If they provide 'Mascot', you write one for a 'Mascot'. Any deviation from the user's provided role is a critical failure.",
  prompt: `Generate a high-quality and professionally accurate job description for the following role and experience level.

  **Job Role:** {{role}}
  **Experience Level:** {{experience}}

  **Your response MUST be for the exact role specified above.** Do not generate a description for any other role.

  The description must include:
  1.  A role summary.
  2.  A list of key responsibilities.
  3.  A list of required technical and soft skills that are **directly relevant** to the specified '{{role}}'. For example, for a 'Software Engineer' role, you must include skills like 'data structures', 'algorithms', and specific programming languages, not 'data analysis' or 'statistical modeling'. For an 'AI Engineer' role, you must include 'machine learning', 'Python', and 'TensorFlow/PyTorch'.
  4.  A list of preferred qualifications.`,
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

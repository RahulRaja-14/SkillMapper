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
  prompt: `You are an expert Human Resources professional who writes compelling and accurate job descriptions.

  Your task is to generate a detailed job description based *only* on the following job role and experience level.
  It is critical that you adhere strictly to the provided role. Do not invent or default to another role (like "Software Developer"). If the user provides "Data Analyst", the description must be for a "Data Analyst". If you are unsure, do not invent a description for a different role.

  Job Title: {{role}}
  Experience Level: {{experience}}

  The job description must be tailored specifically to this role and should include:
  - A brief, engaging summary of the role's primary function.
  - A list of key day-to-day responsibilities.
  - A list of required qualifications, including both technical and soft skills relevant to the specified role and experience.
  - A list of preferred or "nice-to-have" qualifications.
  - A concluding statement about the company culture (you can invent a generic, positive company culture).

  ABSOLUTELY DO NOT invent a different job role. The output must be for the exact role requested.
  Ensure the output is a single, well-formatted string containing the full job description.`,
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

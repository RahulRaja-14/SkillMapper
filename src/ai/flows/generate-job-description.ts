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
  model: gemini15flash,
  system: `You are an expert hiring manager and technical writer. Your one and only task is to generate a professional job description. You MUST follow the user's instructions to the letter.`,
  prompt: `
  **CRITICAL INSTRUCTION: Your entire response depends on the user-provided 'Job Role' and 'Experience Level'. You MUST NOT, under any circumstances, generate a description for a different role or experience level.**

  **User-Provided Job Role:** {{role}}
  **User-Provided Experience Level:** {{experience}}

  Now, generate a professional and highly detailed job description based *only* on the provided role and experience.

  The job description must be structured with the following sections:
  1.  **Role Summary:** Write a brief, compelling overview of the {{role}} position.
  2.  **Key Responsibilities:** Detail the specific duties and day-to-day tasks for a {{role}} with {{experience}} of experience.
  3.  **Required Skills:** List the *essential* technical and soft skills for this specific role. This is the most important section. For example, if the role is 'AI Engineer', you MUST include skills like 'Python', 'Machine Learning', and 'TensorFlow/PyTorch'. If the role is 'Software Developer', you MUST include skills like 'Data Structures', 'Algorithms', and relevant programming languages. Be specific and accurate.
  4.  **Preferred Qualifications:** List additional skills that are beneficial but not strictly required for this role.

  Do not invent a different job role. Stick to the request.
  `,
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

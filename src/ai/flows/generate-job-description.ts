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
  prompt: `You are an expert hiring manager tasked with writing a job description.

  **CRITICAL INSTRUCTION:** Your response MUST be tailored to the EXACT job role and experience level provided below. Do NOT, under any circumstances, generate a description for a different role.

  **Job Role:** {{role}}
  **Experience Level:** {{experience}}

  Generate a professional and detailed job description based on the provided role and experience.

  The job description must include the following sections:
  1.  **Role Summary:** A brief overview of the {{role}} position.
  2.  **Key Responsibilities:** A list of duties and tasks specific to a {{role}} with {{experience}} of experience.
  3.  **Required Skills:** A list of technical and soft skills that are ESSENTIAL for this {{role}}. For example, if the role is 'AI Engineer', you MUST include skills like 'Python', 'Machine Learning', and 'TensorFlow/PyTorch'. If the role is 'Software Developer', you MUST include skills like 'Data Structures', 'Algorithms', and relevant programming languages.
  4.  **Preferred Qualifications:** Additional skills that would be beneficial for this specific role.`,
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

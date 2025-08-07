'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a job description based on a job role and experience level.
 *
 * - generateJobDescription - A function that takes a job role and experience and returns a detailed job description.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateJobDescriptionInputSchema = z.object({
  jobRole: z.string().describe('The job title or role, e.g., "Senior Software Engineer".'),
  experienceLevel: z.enum(['entry', 'mid', 'senior']).describe('The required experience level.'),
  yearsOfExperience: z.number().optional().describe('The number of years of experience required for experienced roles.'),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('A comprehensive job description including responsibilities, qualifications, and preferred skills.'),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateJobDescriptionPrompt',
    input: { schema: GenerateJobDescriptionInputSchema },
    output: { schema: GenerateJobDescriptionOutputSchema },
    prompt: `You are an expert HR manager who writes compelling job descriptions. Generate a comprehensive and professional job description based on the following details.

Job Role: {{{jobRole}}}
Experience Level: {{{experienceLevel}}}
{{#if yearsOfExperience}}
Years of Experience: {{{yearsOfExperience}}}
{{/if}}

Provide a detailed job description that includes:
- **Job Summary**: A brief overview of the role.
- **Responsibilities**: A bulleted list of key duties.
- **Qualifications**: A bulleted list of required skills, experience, and education.
- **Preferred Skills**: A bulleted list of desirable but not essential skills.
- **Company Culture**: A brief note on the work environment.`,
});


const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

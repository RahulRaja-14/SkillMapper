'use server';

/**
 * @fileOverview A resume skill extraction AI agent.
 *
 * - extractResumeSkills - A function that handles the resume skill extraction process.
 * - ExtractResumeSkillsInput - The input type for the extractResumeSkills function.
 * - ExtractResumeSkillsOutput - The return type for the extractResumeSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractResumeSkillsInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
});
export type ExtractResumeSkillsInput = z.infer<typeof ExtractResumeSkillsInputSchema>;

const ExtractResumeSkillsOutputSchema = z.object({
  skills: z.array(z.string()).describe('A list of skills extracted from the resume.'),
});
export type ExtractResumeSkillsOutput = z.infer<typeof ExtractResumeSkillsOutputSchema>;

export async function extractResumeSkills(input: ExtractResumeSkillsInput): Promise<ExtractResumeSkillsOutput> {
  return extractResumeSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractResumeSkillsPrompt',
  input: {schema: ExtractResumeSkillsInputSchema},
  output: {schema: ExtractResumeSkillsOutputSchema},
  prompt: `You are an expert in resume analysis. Your task is to extract a list of skills from the given resume text.

Resume Text: {{{resumeText}}}

Skills:`, // Removed example skills
});

const extractResumeSkillsFlow = ai.defineFlow(
  {
    name: 'extractResumeSkillsFlow',
    inputSchema: ExtractResumeSkillsInputSchema,
    outputSchema: ExtractResumeSkillsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

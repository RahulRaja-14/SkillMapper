'use server';

/**
 * @fileOverview Extracts required skills from a job description, including soft skills.
 *
 * - extractJobSkills - A function that handles the job skill extraction process.
 * - ExtractJobSkillsInput - The input type for the extractJobSkills function.
 * - ExtractJobSkillsOutput - The return type for the extractJobSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractJobSkillsInputSchema = z.object({
  jobDescription: z.string().describe('The job description to extract skills from.'),
});
export type ExtractJobSkillsInput = z.infer<typeof ExtractJobSkillsInputSchema>;

const ExtractJobSkillsOutputSchema = z.object({
  requiredSkills: z.array(z.string()).describe('The list of required skills for the job, including soft skills.'),
});
export type ExtractJobSkillsOutput = z.infer<typeof ExtractJobSkillsOutputSchema>;

export async function extractJobSkills(input: ExtractJobSkillsInput): Promise<ExtractJobSkillsOutput> {
  return extractJobSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractJobSkillsPrompt',
  input: {schema: ExtractJobSkillsInputSchema},
  output: {schema: ExtractJobSkillsOutputSchema},
  prompt: `You are an expert in analyzing job descriptions and extracting required skills. Your task is to identify every skill a candidate would need to be successful in the role.

  Analyze the following job description and extract a comprehensive list of skills. This must include:
  1.  **Technical Skills:** Specific programming languages, frameworks, databases, tools, software, and technical concepts mentioned.
  2.  **Soft Skills:** Interpersonal abilities like communication, teamwork, leadership, problem-solving, time management, adaptability, and emotional intelligence. Look for these even if they are only implied by phrases like "collaborate with cross-functional teams" (implies Teamwork, Communication) or "fast-paced environment" (implies Adaptability).

  Return only an array of strings representing the skills.

  Job Description:
  {{jobDescription}}`,
});

const extractJobSkillsFlow = ai.defineFlow(
  {
    name: 'extractJobSkillsFlow',
    inputSchema: ExtractJobSkillsInputSchema,
    outputSchema: ExtractJobSkillsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

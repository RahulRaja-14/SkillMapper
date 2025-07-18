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
  prompt: `You are an expert in analyzing job descriptions and extracting required skills, including soft skills that may be indirectly mentioned or implied.

  Analyze the following job description and extract a comprehensive list of skills required to perform the job effectively. Include both technical skills and soft skills (e.g., communication, teamwork, problem-solving, time management). Be specific and provide a detailed list of the skills. Output should be an array of strings.

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

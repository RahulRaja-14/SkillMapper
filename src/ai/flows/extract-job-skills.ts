'use server';

/**
 * @fileOverview Extracts required skills from a job description, including soft skills and inferred technical skills.
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
  prompt: `You are an expert in analyzing job descriptions and extracting required skills. Your task is to perform a deep analysis of the following job description and identify every skill a candidate would need to be successful in the role.

  **Instructions:**

  1.  **Identify All Skills:** Find all technical skills (e.g., programming languages, frameworks, libraries, tools, cloud platforms, databases) and soft skills (e.g., Teamwork, Communication, Problem-Solving).
  2.  **Return a Flat List:** Your output must be a single JSON object with a key "requiredSkills" that contains a flat array of all the identified skills.
  3.  **Handle Empty Input:** If the job description is empty or you cannot find any skills, you MUST return an empty array for the 'requiredSkills' field.

  **Job Description to Analyze:**
  {{{jobDescription}}}`,
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

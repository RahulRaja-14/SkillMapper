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

  Analyze the following job description and extract a comprehensive list of skills. This list must be thorough and include three categories:

  1.  **Explicit Technical Skills:** Identify all programming languages, frameworks, databases, tools (e.g., Docker, Git), software, and specific technical concepts that are directly mentioned in the text.

  2.  **Inferred Technical Skills:** This is the most critical part. Based on the responsibilities and requirements, you MUST infer the underlying technical skills that are not explicitly listed but are professionally essential for the role.
      *   **Example 1:** If the description says "develop and deploy scalable web applications," you should infer skills like "REST APIs," "Git," and potentially a cloud platform like "AWS" or "GCP," even if they aren't written down.
      *   **Example 2:** If the role is "AI Engineer" and it mentions "building machine learning models," you MUST infer core skills like "Python," "TensorFlow" or "PyTorch," and "Scikit-learn," as these are fundamental.

  3.  **Soft Skills:** Identify interpersonal abilities. This includes skills explicitly mentioned (e.g., "good communication") and those implied by job duties.
      *   **Example:** If the description says "collaborate with cross-functional teams," you must include "Teamwork" and "Communication." If it says "handle multiple projects in a fast-paced environment," you must include "Time Management" and "Adaptability."

  Your final output must be a single, flat array of strings that combines all the identified skills from these three categories. Do not separate them into groups in the output.

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

'use server';

/**
 * @fileOverview A resume skill extraction AI agent that works on plain text.
 *
 * - extractResumeSkillsFromText - A function that handles the resume skill extraction process from text.
 * - ExtractResumeSkillsFromTextInput - The input type for the function.
 * - ExtractResumeSkillsFromTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractResumeSkillsFromTextInputSchema = z.object({
  resumeText: z.string().describe('The full text content of the resume.'),
});
export type ExtractResumeSkillsFromTextInput = z.infer<typeof ExtractResumeSkillsFromTextInputSchema>;

const ExtractResumeSkillsFromTextOutputSchema = z.object({
  skills: z.array(z.string()).describe('A list of skills extracted from the resume text.'),
});
export type ExtractResumeSkillsFromTextOutput = z.infer<typeof ExtractResumeSkillsFromTextOutputSchema>;

export async function extractResumeSkillsFromText(input: ExtractResumeSkillsFromTextInput): Promise<ExtractResumeSkillsFromTextOutput> {
  return extractResumeSkillsFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractResumeSkillsFromTextPrompt',
  input: {
    schema: ExtractResumeSkillsFromTextInputSchema,
  },
  output: {schema: ExtractResumeSkillsFromTextOutputSchema},
  prompt: `You are an expert resume analysis AI. Your task is to perform a deep analysis of the provided resume text and extract a comprehensive list of all skills.

  **Instructions:**

  1.  Analyze the provided resume text thoroughly to identify all skills. This list must be exhaustive and include:
      *   **Technical Skills:** All programming languages, frameworks, libraries, databases, tools (e.g., Docker, Git, CI/CD), cloud platforms (AWS, GCP, Azure), operating systems, and software mentioned.
      *   **Inferred Skills:** Based on project descriptions, achievements, and work experience, infer the skills that are demonstrated but not explicitly listed. For example, if a project involved "building a scalable REST API," you should infer skills like "API Design," "HTTP," and potentially specific backend technologies if mentioned elsewhere. If the text mentions "Pandas" or "NumPy", you MUST infer "Python".
      *   **Soft Skills:** Interpersonal and professional abilities like Teamwork, Communication, Problem-Solving, Leadership, and Time Management.
  2.  Return a single, flat array of all identified skills in the \`skills\` field.
  3.  **IMPORTANT:** If the resume text is empty or you cannot find any skills, you MUST return an empty array for the 'skills' field (e.g., \`{"skills": []}\`). Do not return null or an error.

  **Resume Text to Analyze:**
  {{{resumeText}}}`,
});

const extractResumeSkillsFromTextFlow = ai.defineFlow(
  {
    name: 'extractResumeSkillsFromTextFlow',
    inputSchema: ExtractResumeSkillsFromTextInputSchema,
    outputSchema: ExtractResumeSkillsFromTextOutputSchema,
  },
  async (input) => {
    // If text is empty, return an empty skills list immediately.
    if (!input.resumeText.trim()) {
      return { skills: [] };
    }

    try {
      const { output } = await prompt(input);
      // The prompt call itself can throw a validation error if the model returns null.
      // We still check for !output as a fallback.
      if (!output) {
        return { skills: [] };
      }
      return output;
    } catch (e) {
      console.error("Genkit flow 'extractResumeSkillsFromTextFlow' failed:", e);
      // If any error occurs (including schema validation), return a valid empty object.
      return { skills: [] };
    }
  }
);

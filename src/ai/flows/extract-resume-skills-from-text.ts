
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

  Your analysis MUST proceed in the following order:

  1.  **Identify Explicit Technical Skills:** This is your primary task. Find all programming languages, frameworks, libraries, databases, tools (e.g., Docker, Git, CI/CD), cloud platforms (AWS, GCP, Azure), operating systems, and software that are *explicitly written* in the text.

  2.  **Identify Inferred Skills:** After you have a list of explicit skills, analyze project descriptions, achievements, and work experience to infer skills that are demonstrated but not explicitly listed.
      *   **Example:** If a project involved "building a scalable REST API," you should infer skills like "API Design," and "HTTP".
      *   **CRITICAL Example:** If the text mentions libraries like "Pandas," "NumPy," or "Scikit-learn", you MUST infer and include the parent language, "Python".
      *   **From Code Snippets:** If you see a block of code, you MUST identify the programming language it's written in (e.g., Python, JavaScript, Java) and add it to the skills list.

  3.  **Identify Soft Skills:** Find interpersonal and professional abilities like Teamwork, Communication, Problem-Solving, Leadership, and Time Management.

  4.  **Final Output:** Return a single, flat array of all identified skills in the \`skills\` field.

  **IMPORTANT:** If the resume text is empty or you cannot find any skills, you MUST return an empty array for the 'skills' field (e.g., \`{"skills": []}\`). Do not return null or an error.

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

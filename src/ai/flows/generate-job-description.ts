
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
  jobDescription: z.string().describe('The generated job description, fully formatted.'),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

const AiOutputSchema = z.object({
  roleSummary: z.string().describe("A brief, compelling overview of the job position."),
  keyResponsibilities: z.array(z.string()).describe("A list of specific duties and day-to-day tasks."),
  requiredSkills: z.array(z.string()).describe("A list of essential technical skills. This should NOT include soft skills like 'communication' or 'teamwork'."),
  preferredQualifications: z.array(z.string()).describe("A list of additional skills that are beneficial but not strictly required."),
});

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: {schema: GenerateJobDescriptionInputSchema},
  output: {schema: AiOutputSchema},
  model: gemini15flash,
  system: `You are an AI assistant that only writes job descriptions. Your only task is to write a job description based on the user's input. CRITICAL: The entire response must be based *only* on the user-provided 'Job Role' and 'Experience Level'. You MUST NOT generate a description for a different role. For example, if the user provides "Data Scientist", you MUST write a description for a "Data Scientist", not for an "AI Engineer" or "Software Engineer". Your output must be directly and exclusively about the provided role.`,
  prompt: `
  Generate a professional and detailed job description for a **{{role}}** with **{{experience}}** experience.

  Create the following sections:
  1.  **Role Summary:** A brief, compelling overview of the {{role}} position.
  2.  **Key Responsibilities:** A list of the specific duties for a {{role}} with {{experience}} of experience.
  3.  **Required Skills:** A list of the *essential technical skills*. Focus only on technologies, programming languages, frameworks, and tools. **DO NOT include soft skills** like "communication," "teamwork," or "leadership."
  4.  **Preferred Qualifications:** A list of beneficial "nice-to-have" skills that are not strictly required.
  `,
});


const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema, 
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("Failed to generate job description components from AI.");
    }
    
    const { roleSummary, keyResponsibilities, requiredSkills, preferredQualifications } = output;

    const jobDescription = `
Job Title: ${input.role} (${input.experience})

Role Summary
${roleSummary}

Key Responsibilities
- ${keyResponsibilities.join('\n- ')}

Required Skills
- ${requiredSkills.join('\n- ')}

Preferred Qualifications
- ${preferredQualifications.join('\n- ')}
`.trim();

    return { jobDescription };
  }
);

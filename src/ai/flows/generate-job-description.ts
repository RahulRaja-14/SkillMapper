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

// The final output of the exported function.
const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('The generated job description, fully formatted.'),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

// The structured output we expect from the AI model.
const AiOutputSchema = z.object({
  roleSummary: z.string().describe("A brief, compelling overview of the job position."),
  keyResponsibilities: z.array(z.string()).describe("A list of specific duties and day-to-day tasks."),
  requiredSkills: z.array(z.string()).describe("A list of essential technical and soft skills."),
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
  system: `You are an expert hiring manager and technical writer. Your task is to generate the components for a professional job description.`,
  prompt: `
  **CRITICAL INSTRUCTION: Your entire response must be based *only* on the user-provided 'Job Role' and 'Experience Level'. Do NOT generate a description for a different role.**

  **Job Role:** {{role}}
  **Experience Level:** {{experience}}

  Generate the following components for a professional and highly detailed job description based *only* on the provided role and experience.

  1.  **Role Summary:** Write a brief, compelling overview of the {{role}} position.
  2.  **Key Responsibilities:** Detail the specific duties for a {{role}} with {{experience}} of experience.
  3.  **Required Skills:** List the *essential* technical and soft skills. Be specific and accurate for the role.
  4.  **Preferred Qualifications:** List beneficial skills that are not strictly required.
  `,
});


const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema, // The flow returns the final, single-string description.
  },
  async (input) => {
    // Call the prompt and get the structured output
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("Failed to generate job description components from AI.");
    }
    
    const { roleSummary, keyResponsibilities, requiredSkills, preferredQualifications } = output;

    // Manually assemble the final job description string
    const jobDescription = `
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

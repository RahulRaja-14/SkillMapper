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
  resumeDataUri: z.string().describe("A PDF resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
});
export type ExtractResumeSkillsInput = z.infer<typeof ExtractResumeSkillsInputSchema>;

const ExtractResumeSkillsOutputSchema = z.object({
  skills: z.array(z.string()).describe('A list of skills extracted from the resume.'),
});
export type ExtractResumeSkillsOutput = z.infer<typeof ExtractResumeSkillsOutputSchema>;

export async function extractResumeSkills(input: ExtractResumeSkillsInput): Promise<ExtractResumeSkillsOutput> {
  return extractResumeSkillsFlow(input);
}

const extractTextFromPdf = ai.defineTool(
  {
    name: 'extractTextFromPdf',
    description: 'Extracts text content from a PDF file provided as a data URI.',
    inputSchema: z.object({
      resumeDataUri: z.string(),
    }),
    outputSchema: z.object({
      resumeText: z.string(),
    }),
  },
  async (input) => {
    try {
      const pdf = (await import('pdf-parse')).default;
      const base64Data = input.resumeDataUri.split(',')[1];
      if (!base64Data) {
        return { resumeText: '' };
      }
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      const data = await pdf(pdfBuffer);
      return { resumeText: data.text || '' };
    } catch (e) {
      console.error('Error parsing PDF:', e);
      return { resumeText: '' };
    }
  }
);


const prompt = ai.definePrompt({
  name: 'extractResumeSkillsPrompt',
  tools: [extractTextFromPdf],
  input: {
    schema: ExtractResumeSkillsInputSchema,
  },
  output: {schema: ExtractResumeSkillsOutputSchema},
  prompt: `You are an expert resume analysis AI. Your task is to extract skills from a resume.

  1.  **CRITICAL:** You **MUST** call the 'extractTextFromPdf' tool using the provided 'resumeDataUri'. Do not try to read the file yourself.
  2.  After you receive the resume text from the tool, analyze that text to identify a list of all technical and soft skills.
  3.  Return the identified skills as a list of strings in the 'skills' field.
  4.  **IMPORTANT:** If the extracted text is empty or you cannot find any skills, you MUST return an empty array for the 'skills' field (e.g., '{"skills": []}'). You must not return null.`,
});

const extractResumeSkillsFlow = ai.defineFlow(
  {
    name: 'extractResumeSkillsFlow',
    inputSchema: ExtractResumeSkillsInputSchema,
    outputSchema: ExtractResumeSkillsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      // The prompt call itself can throw a validation error if the model returns null.
      // We still check for !output as a fallback.
      if (!output) {
        return { skills: [] };
      }
      return output;
    } catch (e) {
      console.error("Genkit flow 'extractResumeSkillsFlow' failed:", e);
      // If any error occurs (including schema validation), return a valid empty object.
      return { skills: [] };
    }
  }
);

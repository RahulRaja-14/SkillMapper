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
    const pdf = (await import('pdf-parse')).default;
    const base64Data = input.resumeDataUri.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    const data = await pdf(pdfBuffer);
    return { resumeText: data.text };
  }
);


const prompt = ai.definePrompt({
  name: 'extractResumeSkillsPrompt',
  tools: [extractTextFromPdf],
  input: {
    schema: ExtractResumeSkillsInputSchema,
  },
  output: {schema: ExtractResumeSkillsOutputSchema},
  prompt: `You are an expert in resume analysis. 
  
  Your task is to extract a list of all skills from the given resume text, which you will obtain by using the provided tool.
  You MUST call the extractTextFromPdf tool with the provided resumeDataUri to get the text of the resume.
  Then, analyze the extracted text to identify all skills.`,
});

const extractResumeSkillsFlow = ai.defineFlow(
  {
    name: 'extractResumeSkillsFlow',
    inputSchema: ExtractResumeSkillsInputSchema,
    outputSchema: ExtractResumeSkillsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
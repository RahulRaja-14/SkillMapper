
'use server';

/**
 * @fileOverview A resume skill extraction AI agent. This flow is a wrapper that extracts text and calls the text-based analysis flow.
 *
 * - extractResumeSkills - A function that handles the resume skill extraction process from a PDF Data URI.
 * - ExtractResumeSkillsInput - The input type for the extractResumeSkills function.
 * - ExtractResumeSkillsOutput - The return type for the extractResumeSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { extractResumeSkillsFromText } from './extract-resume-skills-from-text';

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

// This is now a simple async function, not a Genkit tool.
async function extractTextFromPdf(resumeDataUri: string): Promise<string> {
  try {
    const pdf = (await import('pdf-parse')).default;
    const base64Data = resumeDataUri.split(',')[1];
    if (!base64Data) {
      console.error('No Base64 data found in data URI.');
      return '';
    }
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    const data = await pdf(pdfBuffer);
    return data.text || '';
  } catch (e) {
    console.error('Error parsing PDF:', e);
    return '';
  }
}

const extractResumeSkillsFlow = ai.defineFlow(
  {
    name: 'extractResumeSkillsFlow',
    inputSchema: ExtractResumeSkillsInputSchema,
    outputSchema: ExtractResumeSkillsOutputSchema,
  },
  async (input) => {
    // Step 1: Directly extract text from the PDF.
    const resumeText = await extractTextFromPdf(input.resumeDataUri);

    // If text extraction fails or is empty, return an empty skills list immediately.
    if (!resumeText) {
      console.error("Resume text could not be extracted. Returning empty skills array.");
      return { skills: [] };
    }

    try {
      // Step 2: Pass the extracted text to the AI for analysis.
      const result = await extractResumeSkillsFromText({ resumeText });
      return result;
    } catch (e) {
      console.error("Genkit flow 'extractResumeSkillsFlow' failed:", e);
      // If any error occurs (including schema validation), return a valid empty object.
      return { skills: [] };
    }
  }
);

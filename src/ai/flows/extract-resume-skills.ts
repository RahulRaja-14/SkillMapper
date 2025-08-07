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

// This internal schema is not exported, as the text extraction is now a step within the flow.
const ExtractResumeSkillsFromTextSchema = z.object({
  resumeText: z.string().describe('The full text content of the resume.'),
});

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

const prompt = ai.definePrompt({
  name: 'extractResumeSkillsPrompt',
  input: {
    schema: ExtractResumeSkillsFromTextSchema,
  },
  output: {schema: ExtractResumeSkillsOutputSchema},
  prompt: `You are an expert resume analysis AI. Your task is to perform a deep analysis of the provided resume text and extract a comprehensive list of all skills.

  **Instructions:**

  1.  Analyze the provided resume text thoroughly to identify all skills. This list must be exhaustive and include:
      *   **Technical Skills:** All programming languages, frameworks, libraries, databases, tools (e.g., Docker, Git, CI/CD), cloud platforms (AWS, GCP, Azure), operating systems, and software mentioned.
      *   **Inferred Skills:** Based on project descriptions, achievements, and work experience, infer the skills that are demonstrated but not explicitly listed. For example, if a project involved "building a scalable REST API," you should infer skills like "API Design," "HTTP," and potentially specific backend technologies if mentioned elsewhere.
      *   **Soft Skills:** Interpersonal and professional abilities like Teamwork, Communication, Problem-Solving, Leadership, and Time Management.
  2.  Return a single, flat array of all identified skills in the \`skills\` field.
  3.  **IMPORTANT:** If the resume text is empty or you cannot find any skills, you MUST return an empty array for the 'skills' field (e.g., \`{"skills": []}\`). Do not return null or an error.

  **Resume Text to Analyze:**
  {{{resumeText}}}`,
});

const extractResumeSkillsFlow = ai.defineFlow(
  {
    name: 'extractResumeSkillsFlow',
    inputSchema: ExtractResumeSkillsInputSchema,
    outputSchema: ExtractResumeSkillsOutputSchema,
  },
  async (input) => {
    // Step 1: Directly extract text from the PDF. This is no longer an AI tool call.
    const resumeText = await extractTextFromPdf(input.resumeDataUri);

    // If text extraction fails, return empty skills list immediately.
    if (!resumeText) {
      console.error("Resume text could not be extracted. Returning empty skills array.");
      return { skills: [] };
    }

    try {
      // Step 2: Pass the extracted text to the AI for analysis.
      const { output } = await prompt({ resumeText });
      
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

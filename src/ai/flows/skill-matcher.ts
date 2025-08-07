
'use server';

/**
 * @fileOverview Analyzes a resume against a job description to identify skill gaps.
 *
 * - skillMatcher - A function that orchestrates the skill analysis process.
 * - SkillMatcherInput - The input type for the skillMatcher function.
 * - SkillMatcherOutput - The return type for the skillMatcher function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {extractJobSkills} from './extract-job-skills';
import {extractResumeSkillsFromText} from './extract-resume-skills-from-text';

const SkillMatcherInputSchema = z.object({
  jobDescription: z.string().describe('The full text of the job description.'),
  resumeDataUri: z.string().describe("A PDF resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
});
export type SkillMatcherInput = z.infer<typeof SkillMatcherInputSchema>;

const SkillMatcherOutputSchema = z.object({
  matchedSkills: z.array(z.string()).describe('A list of skills that are present in both the resume and the job description.'),
  missingSkills: z.array(z.string()).describe('A list of skills that are required for the job but not found in the resume.'),
  allJobSkills: z.array(z.string()).describe('A list of all skills required for the job.'),
  resumeText: z.string().describe('The extracted text from the resume for debugging.'),
});
export type SkillMatcherOutput = z.infer<typeof SkillMatcherOutputSchema>;


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

function compareSkills(jobSkills: string[], resumeSkills: string[]): Omit<SkillMatcherOutput, 'resumeText'> {
  // Create a unique, trimmed list of all job skills.
  const allJobSkills = [...new Set(jobSkills.map(skill => skill.trim()))];
  // Create a lowercase set of resume skills for efficient, case-insensitive lookup.
  const resumeSkillSet = new Set(resumeSkills.map(skill => skill.toLowerCase().trim()));

  const matchedSkills = allJobSkills.filter(skill => resumeSkillSet.has(skill.toLowerCase()));
  const missingSkills = allJobSkills.filter(skill => !resumeSkillSet.has(skill.toLowerCase()));

  return { matchedSkills, missingSkills, allJobSkills };
}


const skillMatcherFlow = ai.defineFlow(
  {
    name: 'skillMatcherFlow',
    inputSchema: SkillMatcherInputSchema,
    outputSchema: SkillMatcherOutputSchema,
  },
  async (input) => {
    
    // Step 1: Extract text from the resume PDF. This is the single source of truth for the resume content.
    const resumeText = await extractTextFromPdf(input.resumeDataUri);

    // Step 2: Concurrently extract skills from the job description and the now-extracted resume text.
    const [jobSkillsResult, resumeSkillsResult] = await Promise.all([
      extractJobSkills({ jobDescription: input.jobDescription }),
      extractResumeSkillsFromText({ resumeText: resumeText }), // Use the new flow that takes text
    ]);
    
    const jobSkills = jobSkillsResult?.requiredSkills || [];
    const resumeSkills = resumeSkillsResult?.skills || [];
    
    // Step 3: Compare the two lists of skills.
    const comparison = compareSkills(jobSkills, resumeSkills);

    // Step 4: Return the final result, including the resume text for debugging.
    return {
      ...comparison,
      resumeText: resumeText,
    };
  }
);

export async function skillMatcher(input: SkillMatcherInput): Promise<SkillMatcherOutput> {
  return skillMatcherFlow(input);
}

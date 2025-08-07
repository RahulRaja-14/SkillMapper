
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
import {extractResumeSkills} from './extract-resume-skills';

const SkillMatcherInputSchema = z.object({
  jobDescription: z.string().describe('The full text of the job description.'),
  resumeDataUri: z.string().describe("A PDF resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
});
export type SkillMatcherInput = z.infer<typeof SkillMatcherInputSchema>;

const SkillMatcherOutputSchema = z.object({
  matchedSkills: z.array(z.string()).describe('A list of skills that are present in both the resume and the job description.'),
  missingSkills: z.array(z.string()).describe('A list of skills that are required for the job but not found in the resume.'),
  allJobSkills: z.array(z.string()).describe('A list of all skills required for the job.'),
});
export type SkillMatcherOutput = z.infer<typeof SkillMatcherOutputSchema>;

function compareSkills(jobSkills: string[], resumeSkills: string[]): SkillMatcherOutput {
  const jobSkillSet = new Set(jobSkills.map(skill => skill.toLowerCase().trim()));
  const resumeSkillSet = new Set(resumeSkills.map(skill => skill.toLowerCase().trim()));

  const allJobSkills = Array.from(new Set(jobSkills.map(s => s.trim())));

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
    const [jobSkillsResult, resumeSkillsResult] = await Promise.all([
      extractJobSkills({ jobDescription: input.jobDescription }),
      extractResumeSkills({ resumeDataUri: input.resumeDataUri }),
    ]);

    // Handle cases where skill extraction might return null or undefined outputs.
    const jobSkills = jobSkillsResult?.requiredSkills || [];
    const resumeSkills = resumeSkillsResult?.skills || [];

    return compareSkills(jobSkills, resumeSkills);
  }
);

export async function skillMatcher(input: SkillMatcherInput): Promise<SkillMatcherOutput> {
  return skillMatcherFlow(input);
}


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
import {extractJobSkills, ExtractJobSkillsOutput} from './extract-job-skills';
import {extractResumeSkills, ExtractResumeSkillsOutput} from './extract-resume-skills';

const SkillMatcherInputSchema = z.object({
  jobDescription: z.string().describe('The full text of the job description.'),
  resume: z.string().describe('The full text of the resume.'),
});
export type SkillMatcherInput = z.infer<typeof SkillMatcherInputSchema>;

const SkillMatcherOutputSchema = z.object({
  matchedSkills: z.array(z.string()).describe('A list of skills that are present in both the resume and the job description.'),
  missingSkills: z.array(z.string()).describe('A list of skills that are required for the job but not found in the resume.'),
  allJobSkills: z.array(z.string()).describe('A list of all skills required for the job.'),
});
export type SkillMatcherOutput = z.infer<typeof SkillMatcherOutputSchema>;

function compareSkills(jobSkills: ExtractJobSkillsOutput, resumeSkills: ExtractResumeSkillsOutput): SkillMatcherOutput {
  const jobSkillSet = new Set(jobSkills.requiredSkills.map(skill => skill.toLowerCase().trim()));
  const resumeSkillSet = new Set(resumeSkills.skills.map(skill => skill.toLowerCase().trim()));

  const allJobSkills = Array.from(jobSkillSet).map(skill => jobSkills.requiredSkills.find(s => s.toLowerCase().trim() === skill)!);

  const matchedSkills = allJobSkills.filter(skill => resumeSkillSet.has(skill.toLowerCase().trim()));
  const missingSkills = allJobSkills.filter(skill => !resumeSkillSet.has(skill.toLowerCase().trim()));

  return { matchedSkills, missingSkills, allJobSkills };
}

const skillMatcherFlow = ai.defineFlow(
  {
    name: 'skillMatcherFlow',
    inputSchema: SkillMatcherInputSchema,
    outputSchema: SkillMatcherOutputSchema,
  },
  async (input) => {
    const [jobSkills, resumeSkills] = await Promise.all([
      extractJobSkills({ jobDescription: input.jobDescription }),
      extractResumeSkills({ resume: input.resume }),
    ]);

    return compareSkills(jobSkills, resumeSkills);
  }
);

export async function skillMatcher(input: SkillMatcherInput): Promise<SkillMatcherOutput> {
  return skillMatcherFlow(input);
}

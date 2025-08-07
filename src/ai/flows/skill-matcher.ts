
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
});
export type SkillMatcherOutput = z.infer<typeof SkillMatcherOutputSchema>;

function compareSkills(jobSkills: ExtractJobSkillsOutput, resumeSkills: ExtractResumeSkillsOutput): SkillMatcherOutput {
  const jobSkillSet = new Set(jobSkills.skills.map(skill => skill.toLowerCase()));
  const resumeSkillSet = new Set(resumeSkills.skills.map(skill => skill.toLowerCase()));

  const matchedSkills = [...jobSkillSet].filter(skill => resumeSkillSet.has(skill));
  const missingSkills = [...jobSkillSet].filter(skill => !resumeSkillSet.has(skill));

  return { matchedSkills, missingSkills };
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

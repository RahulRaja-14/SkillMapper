'use server';

/**
 * @fileOverview Analyzes a resume against a job description to identify skill gaps and provide a match score.
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
  resumeText: z.string().describe('The full text content of the resume.'),
});
export type SkillMatcherInput = z.infer<typeof SkillMatcherInputSchema>;

const SkillMatcherOutputSchema = z.object({
  matchedSkills: z.array(z.string()).describe('A list of skills that are present in both the resume and the job description.'),
  missingSkills: z.array(z.string()).describe('A list of skills that are required for the job but not found in the resume.'),
  allJobSkills: z.array(z.string()).describe('A list of all skills required for the job.'),
  score: z.number().describe('The percentage of job skills found in the resume, from 0 to 100.'),
});
export type SkillMatcherOutput = z.infer<typeof SkillMatcherOutputSchema>;


function compareSkills(jobSkills: string[], resumeSkills: string[]): Omit<SkillMatcherOutput, 'score' | 'allJobSkills'> {
    // Create a unique, case-insensitive set of skills from the resume for efficient lookup.
    const resumeSkillSet = new Set(resumeSkills.map(skill => skill.trim().toLowerCase()));
  
    // Create a unique list of job skills to handle potential duplicates from the AI.
    const uniqueJobSkills = [...new Set(jobSkills.map(skill => skill.trim()))];
  
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
  
    // Iterate over the unique job skills and check for matches.
    uniqueJobSkills.forEach(jobSkill => {
      // Perform a case-insensitive check.
      if (resumeSkillSet.has(jobSkill.toLowerCase())) {
        matchedSkills.push(jobSkill);
      } else {
        missingSkills.push(jobSkill);
      }
    });
  
    return { matchedSkills, missingSkills };
  }

  function filterSubSkills(skills: string[]): string[] {
    const skillSet = new Set(skills.map(s => s.toLowerCase()));
    const basicSkills = ['documentation', 'mathematics'];
    
    const subSkills = {
      python: ['pandas', 'numpy', 'scikit-learn', 'matplotlib', 'seaborn', 'tensorflow', 'pytorch'],
      javascript: ['react', 'vue', 'angular', 'next.js'],
      'data science': ['data collection', 'data cleaning', 'data preprocessing', 'data analysis', 'data modeling', 'data mining', 'statistical modeling', 'model building', 'model deployment', 'model evaluation', 'data reporting'],
      // Add more parent-sub-skill relationships here as needed
    };

    let filteredSkills = [...skills];

    for (const parent in subSkills) {
      if (skillSet.has(parent)) {
        const subSkillList = subSkills[parent as keyof typeof subSkills];
        filteredSkills = filteredSkills.filter(skill => !subSkillList.includes(skill.toLowerCase()));
      }
    }

    filteredSkills = filteredSkills.filter(skill => !basicSkills.includes(skill.toLowerCase()));

    return filteredSkills;
  }


const skillMatcherFlow = ai.defineFlow(
  {
    name: 'skillMatcherFlow',
    inputSchema: SkillMatcherInputSchema,
    outputSchema: SkillMatcherOutputSchema,
  },
  async (input) => {
    
    // Step 1: Concurrently extract skills from the job description and the resume text.
    const [jobSkillsResult, resumeSkillsResult] = await Promise.all([
      extractJobSkills({ jobDescription: input.jobDescription }),
      extractResumeSkillsFromText({ resumeText: input.resumeText }),
    ]);
    
    let jobSkills = [...new Set(jobSkillsResult?.requiredSkills || [])];
    let resumeSkills = resumeSkillsResult?.skills || [];
    
    // Step 2: Filter out sub-skills
    jobSkills = filterSubSkills(jobSkills);
    resumeSkills = filterSubSkills(resumeSkills);
    
    // Step 3: Compare the two lists of skills using the robust, case-insensitive comparison function.
    const comparison = compareSkills(jobSkills, resumeSkills);

    // Step 4: Calculate the match score as a percentage.
    const score = jobSkills.length > 0
      ? Math.round((comparison.matchedSkills.length / jobSkills.length) * 100)
      : 100; // If there are no job skills, score is 100%.

    // Step 5: Return the final result.
    return {
      ...comparison,
      allJobSkills: jobSkills,
      score,
    };
  }
);

export async function skillMatcher(input: SkillMatcherInput): Promise<SkillMatcherOutput> {
  return skillMatcherFlow(input);
}

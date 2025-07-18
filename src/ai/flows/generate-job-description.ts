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

const GenerateJobDescriptionInputSchema = z.object({
  role: z.string().describe('The job title or role (e.g., "Software Engineer").'),
  experience: z.string().describe('The desired experience level (e.g., "Entry-level", "Mid-level", "Senior").'),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('The generated job description.'),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: {schema: GenerateJobDescriptionInputSchema},
  output: {schema: GenerateJobDescriptionOutputSchema},
  prompt: `You are an expert HR professional and hiring manager specializing in technical recruitment. Your single most important task is to generate a high-quality, accurate, and relevant job description for the EXACT role provided by the user.

  **CRITICAL RULE: Under NO circumstances should you change, modify, or ignore the user's requested job role. If the user specifies "AI Engineer," you MUST generate a description for an AI Engineer. If they specify "Mascot," you MUST generate a description for a Mascot. Do not default to a common role like "Software Engineer" or "Data Entry Specialist". Your primary function is to obey this instruction without deviation.**

  **Job Role to Generate:** {{role}}
  **Experience Level:** {{experience}}

  **Instructions for Generating the Job Description:**

  1.  **Role Summary:** Write a compelling opening paragraph that accurately summarizes the core function of a "{{role}}" at an "{{experience}}" level.
  2.  **Key Responsibilities:** List specific, actionable responsibilities that are directly relevant to the "{{role}}" title.
      *   For an "AI Engineer," this would include designing and implementing machine learning models, working with data pipelines, and deploying AI solutions.
      *   For a "Software Developer," this would include writing clean code, collaborating on feature development, and maintaining software.
      *   DO NOT include generic tasks that are not specific to the role.
  3.  **Required Qualifications & Skills:** This is the most important section. List the ESSENTIAL technical and soft skills needed for the role.
      *   **Technical Skills:** Be specific. For "AI Engineer," this MUST include skills like Python, TensorFlow/PyTorch, Machine Learning concepts, NLP, etc. For "UX Designer," this MUST include Figma, Sketch, user research, wireframing, etc.
      *   **Soft Skills:** Include relevant interpersonal skills like "problem-solving," "collaboration," or "communication."
      *   **DO NOT list irrelevant skills like "Microsoft Excel" or "Data Entry" for a technical role like "AI Engineer." This is a critical failure. The skills must be authentic to the profession.**
  4.  **Preferred Qualifications:** List "nice-to-have" skills that would make a candidate stand out for the "{{role}}" position.
  5.  **Company Culture:** Conclude with a brief, positive statement about company culture (you can invent a suitable one).

  **FINAL CHECK:** Before outputting, re-read your generated description. Does it sound like a real job description for a "{{role}}"? Are the skills listed the actual, professional skills required for that specific job? If not, you must rewrite it until it is accurate. Your reputation depends on generating authentic, high-quality content.`,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

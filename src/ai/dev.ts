import { config } from 'dotenv';
config();

import '@/ai/flows/extract-job-skills.ts';
import '@/ai/flows/extract-resume-skills.ts';
import '@/ai/flows/suggest-resources.ts';
import '@/ai/flows/generate-job-description.ts';

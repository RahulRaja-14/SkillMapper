"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Wand2, FileUp, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { extractJobSkills } from "@/ai/flows/extract-job-skills";
import { extractResumeSkills } from "@/ai/flows/extract-resume-skills";
import { suggestResources, type SuggestResourcesOutput } from "@/ai/flows/suggest-resources";
import { SkillReport } from "@/components/skill-report";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const formSchema = z.object({
  resumeFile: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Only .pdf files are accepted."
    ),
  jobDescription: z.string().min(100, {
    message: "Job description must be at least 100 characters.",
  }),
});

export type AnalysisResult = {
  matchedSkills: string[];
  missingSkills: string[];
  jobSkills: string[];
  resourceSuggestions: SuggestResourcesOutput["suggestions"];
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function SkillMapperPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
    },
  });

  const resumeFileRef = form.register("resumeFile");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const resumeDataUri = await fileToDataUri(values.resumeFile);

      const [resumeResult, jobResult] = await Promise.all([
        extractResumeSkills({ resumeDataUri }),
        extractJobSkills({ jobDescription: values.jobDescription }),
      ]);
      
      const resumeSkillsSet = new Set(resumeResult.skills.map(skill => skill.toLowerCase().trim()));
      const jobSkills = jobResult.requiredSkills.map(skill => skill.trim());

      const matchedSkills = jobSkills.filter(skill => resumeSkillsSet.has(skill.toLowerCase()));
      const missingSkills = jobSkills.filter(skill => !resumeSkillsSet.has(skill.toLowerCase()));

      let resourceSuggestions: SuggestResourcesOutput["suggestions"] = [];
      if (missingSkills.length > 0) {
        const resources = await suggestResources({ missingSkills });
        resourceSuggestions = resources.suggestions;
      }
      
      setAnalysisResult({
        matchedSkills,
        missingSkills,
        jobSkills,
        resourceSuggestions,
      });

    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with our AI. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const selectedFile = form.watch("resumeFile");

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
              SkillMapper
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Bridge the gap between your resume and your dream job.
            </p>
          </header>

          <div className="bg-card p-6 md:p-8 rounded-lg shadow-sm border">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="resumeFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Your Resume (PDF)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              id="resume-upload"
                              {...resumeFileRef}
                              onChange={(e) => field.onChange(e.target.files?.[0])}
                            />
                            <label htmlFor="resume-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50">
                              {selectedFile ? (
                                <div className="text-center">
                                  <FileText className="mx-auto h-12 w-12 text-primary" />
                                  <p className="mt-2 font-semibold text-foreground">{selectedFile.name}</p>
                                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                  <p className="mt-2 text-sm text-accent">Click or drag to change</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    <span className="font-semibold text-accent">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground">PDF only, max 5MB</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Job Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste the job description here..."
                            className="h-64 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Paste the description of the job you're applying for.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-center">
                  <Button type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Analyze Skills
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="mt-12">
            {isLoading && (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-sm border">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-xl font-semibold font-headline">Generating Your Skill Report</h3>
                <p className="text-muted-foreground mt-1">Our AI is analyzing your skills... please wait.</p>
              </div>
            )}
            {!isLoading && analysisResult && (
              <div className="animate-in fade-in-50 duration-500">
                <SkillReport result={analysisResult} />
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="py-4">
        <p className="text-center text-sm text-muted-foreground">
          Powered by GenAI. Built for you.
        </p>
      </footer>
    </div>
  );
}

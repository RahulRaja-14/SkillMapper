
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Wand2, FileUp, FileText, Briefcase, Paperclip, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { suggestResources, type SuggestResourcesOutput } from "@/ai/flows/suggest-resources";
import { generateJobDescription } from "@/ai/flows/generate-job-description";
import { skillMatcher } from "@/ai/flows/skill-matcher";
import { SkillReport } from "@/components/skill-report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const formSchema = z.object({
  resumeFile: z
    .instanceof(File, { message: "Please upload your resume." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Only .pdf files are accepted."
    ),
  jobDescription: z.string().min(1, {
    message: "Job description cannot be empty.",
  }).min(100, {
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [experienceType, setExperienceType] = useState<"entry" | "mid" | "senior">("entry");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState("paste");


  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
    },
  });

  const resumeFileRef = form.register("resumeFile");
  
  async function handleGenerateDescription(e: React.MouseEvent) {
    e.preventDefault();

    if (!jobRole) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a job role.",
      });
      return;
    }

    const years = Number(experienceYears);
    if (experienceType !== 'entry' && (isNaN(years) || years <= 0)) {
       toast({
        variant: "destructive",
        title: "Invalid Experience",
        description: "Please enter a valid number of years for experience.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateJobDescription({
        jobRole: jobRole,
        experienceLevel: experienceType,
        ...(experienceType !== 'entry' && { yearsOfExperience: years })
      });
      form.setValue("jobDescription", result.jobDescription, { shouldValidate: true });
      setActiveTab("paste");
      toast({
        title: "Success!",
        description: "Job description generated and added to the form.",
      });
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem generating the job description. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const resumeDataUri = await fileToDataUri(values.resumeFile);

      const { matchedSkills, missingSkills, allJobSkills } = await skillMatcher({
        jobDescription: values.jobDescription,
        resumeDataUri: resumeDataUri,
      });

      let resourceSuggestions: SuggestResourcesOutput["suggestions"] = [];
      if (missingSkills.length > 0) {
        const resources = await suggestResources({ missingSkills });
        resourceSuggestions = resources.suggestions;
      }
      
      setAnalysisResult({
        matchedSkills,
        missingSkills,
        jobSkills: allJobSkills,
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
  const jobDescriptionValue = form.watch("jobDescription");

  return (
    <>
      <div className="flex flex-col min-h-screen bg-secondary/40 dark:bg-secondary/20">
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto grid gap-12">
            <header className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter bg-gradient-to-br from-primary from-40% to-accent bg-clip-text text-transparent">
                SkillMapper AI
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Bridge the gap between your resume and your dream job. Upload your resume and paste a job description to get started.
              </p>
            </header>
            
            {!analysisResult && (
              <Card className="shadow-lg animate-in fade-in-50 duration-500">
                <CardContent className="p-6 md:p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8 items-start">
                        <FormField
                          control={form.control}
                          name="resumeFile"
                          render={({ field }) => (
                            <FormItem className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Paperclip className="text-primary" />
                                <FormLabel className="text-lg font-semibold">Your Resume</FormLabel>
                              </div>
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
                                  <label htmlFor="resume-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors">
                                    {selectedFile ? (
                                      <div className="text-center p-4">
                                        <FileText className="mx-auto h-12 w-12 text-primary" />
                                        <p className="mt-2 font-semibold text-foreground truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <p className="mt-2 text-sm text-accent">Click or drag to change</p>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">
                                          <span className="font-semibold text-accent">Click to upload</span> or drag & drop
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
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="text-primary" />
                            <FormLabel className="text-lg font-semibold">Job Description</FormLabel>
                          </div>
                          <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="paste">Paste</TabsTrigger>
                              <TabsTrigger value="generate">Generate w/ AI</TabsTrigger>
                            </TabsList>
                            <TabsContent value="generate" className="space-y-4 pt-2">
                                <div className="space-y-2">
                                  <Label htmlFor="job-role">Job Role</Label>
                                  <Input
                                    id="job-role"
                                    type="text"
                                    placeholder="e.g. AI Engineer"
                                    value={jobRole}
                                    onChange={(e) => setJobRole(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Experience Level</Label>
                                  <RadioGroup
                                    value={experienceType}
                                    onValueChange={(value: "entry" | "mid" | "senior") => setExperienceType(value)}
                                    className="flex gap-4 pt-1"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="entry" id="entry" />
                                      <Label htmlFor="entry">Entry</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="mid" id="mid" />
                                      <Label htmlFor="mid">Mid-level</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="senior" id="senior" />
                                      <Label htmlFor="senior">Senior</Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                                {experienceType !== "entry" && (
                                  <div className="space-y-2 animate-in fade-in-20">
                                    <Label htmlFor="experience-years">Years of Experience</Label>
                                    <Input
                                      id="experience-years"
                                      type="number"
                                      placeholder="e.g. 5"
                                      value={experienceYears}
                                      onChange={(e) => setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))}
                                      className="w-40"
                                    />
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <Button variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Generate
                                  </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="paste">
                              <FormField
                                control={form.control}
                                name="jobDescription"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Paste the full job description here..."
                                        className="h-[14.5rem] resize-none"
                                        {...field}
                                        value={jobDescriptionValue}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <Button type="submit" size="lg" disabled={isLoading || isGenerating} className="shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow">
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-2 h-5 w-5" />
                              Analyze Skills
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            <div className="mt-0">
              {isLoading && (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-sm border animate-in fade-in-50 duration-500">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-xl font-semibold font-headline">Generating Your Skill Report</h3>
                  <p className="text-muted-foreground mt-1">Our AI is analyzing your skills... please wait.</p>
                </div>
              )}
              {!isLoading && analysisResult && (
                <div className="animate-in fade-in-50 duration-500 space-y-8">
                  <SkillReport result={analysisResult} />
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAnalysisResult(null);
                        form.reset({ jobDescription: "" });
                        setJobRole("");
                        setExperienceType("entry");
                        setExperienceYears("");
                      }}
                    >
                      Analyze Another
                    </Button>
                  </div>
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
    </>
  );
}

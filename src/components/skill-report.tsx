"use client";

import type { AnalysisResult } from "@/app/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Globe, GraduationCap, LinkIcon, Youtube } from "lucide-react";
import React from "react";

interface SkillReportProps {
  result: AnalysisResult;
}

export function SkillReport({ result }: SkillReportProps) {
  const { matchedSkills, missingSkills, jobSkills, resourceSuggestions } = result;
  const matchPercentage = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;
  
  const top5MissingSkills = missingSkills.slice(0, 5);

  const resourceMap = new Map(resourceSuggestions.map(s => [s.skill.toLowerCase(), s]));

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/30">
          <CardTitle className="font-headline text-2xl">Analysis Complete!</CardTitle>
          <CardDescription>Here's the breakdown of your skill match for this role.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-4xl text-primary">{matchPercentage}%</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Skill Match Score</p>
              <Progress value={matchPercentage} className="w-full h-3" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">You possess {matchedSkills.length} out of the {jobSkills.length} required skills.</p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <CheckCircle2 className="text-green-500" />
              Your Strengths
            </CardTitle>
            <CardDescription>
              These are the required skills found in your resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-base py-1 px-3 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No matching skills were found for this role.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <AlertTriangle className="text-amber-500" />
              Top 5 Areas for Growth
            </CardTitle>
            <CardDescription>
              Focus on these key skills to become a stronger candidate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {top5MissingSkills.length > 0 ? (
              <div className="space-y-4">
                {top5MissingSkills.map((skill) => {
                  const suggestion = resourceMap.get(skill.toLowerCase());
                  const hasResources = suggestion && (suggestion.websites.length > 0 || suggestion.youtubeChannels.length > 0);

                  return (
                    <div key={skill}>
                      <p className="font-semibold text-base">{skill}</p>
                      {hasResources && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                           {[...(suggestion.websites || []), ...(suggestion.youtubeChannels || [])].map((link, index) => (
                              <a
                                key={index}
                                href={link.startsWith('http') ? link : `https://${link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <LinkIcon className="w-3 h-3"/>
                                {link.replace(/^(https?:\/\/)?(www\.)?/, '')}
                              </a>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Great news! You seem to have all the required skills.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
import { AlertTriangle, CheckCircle2, Globe, Youtube } from "lucide-react";
import React from "react";

interface SkillReportProps {
  result: AnalysisResult;
}

export function SkillReport({ result }: SkillReportProps) {
  const { matchedSkills, missingSkills, jobSkills, resourceSuggestions } = result;
  const matchPercentage = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Analysis Complete!</CardTitle>
          <CardDescription>Here's the breakdown of your skill match for this role.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <span className="font-bold text-4xl text-primary">{matchPercentage}%</span>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Match Score</p>
              <Progress value={matchPercentage} className="w-full h-3" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">You possess {matchedSkills.length} out of the {jobSkills.length} required skills.</p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <CheckCircle2 className="text-green-500" />
              Matched Skills
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <AlertTriangle className="text-amber-500" />
              Skills to Improve
            </CardTitle>
            <CardDescription>
              Consider developing these skills to be a stronger candidate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-base py-1 px-3 border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Great news! You seem to have all the required skills.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {resourceSuggestions && resourceSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Learning Resources</CardTitle>
            <CardDescription>
              Here are some AI-powered suggestions to help you learn the missing skills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {resourceSuggestions.map((suggestion, index) => (
                <AccordionItem value={`item-${index}`} key={suggestion.skill}>
                  <AccordionTrigger className="text-lg hover:no-underline">
                    {suggestion.skill}
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-4">
                      {suggestion.websites.length > 0 && (
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-accent" />
                            Websites
                          </h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {suggestion.websites.map((site) => (
                              <li key={site}>
                                <a
                                  href={`https://${site}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {site}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {suggestion.websites.length > 0 && suggestion.youtubeChannels.length > 0 && <Separator />}
                      {suggestion.youtubeChannels.length > 0 && (
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <Youtube className="w-4 h-4 text-accent" />
                            YouTube Channels
                          </h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {suggestion.youtubeChannels.map((channel) => (
                              <li key={channel}>
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(channel)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {channel}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

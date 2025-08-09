import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnalysisResult } from "@/app/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, XCircle, GraduationCap } from "lucide-react";


export function SkillReport({ result }: { result: AnalysisResult }) {
  const scoreColor = result.matchedSkills.length / result.jobSkills.length > 0.5 ? "text-green-500" : "text-orange-500";
  const matchedSkillsSet = new Set(result.matchedSkills.map(s => s.toLowerCase()));
  const top5ResourceSuggestions = result.resourceSuggestions.slice(0, 5);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold font-headline">Skill Match Score</CardTitle>
            <span className={`text-4xl font-bold ${scoreColor}`}>{Math.round((result.matchedSkills.length / result.jobSkills.length) * 100)}%</span>
          </div>
          <CardDescription>You possess {result.matchedSkills.length} out of the {result.jobSkills.length} required skills.</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(result.matchedSkills.length / result.jobSkills.length) * 100} className="w-full" />
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              <CardTitle className="font-headline">Your Strengths</CardTitle>
            </div>
            <CardDescription>These are the required skills found in your resume.</CardDescription>
          </CardHeader>
          <CardContent>
            {result.matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.matchedSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-base">{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No matching skills were found for this role.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="text-red-500" />
                <CardTitle className="font-headline">Your Skill Gaps</CardTitle>
              </div>
            <CardDescription>Here are the skills required for the job that we didn't find in your resume.</CardDescription>
          </CardHeader>
          <CardContent>
            {result.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((skill) => (
                  <Badge key={skill} variant="destructive" className="text-base">{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Congratulations! Your skills are a perfect match for this job.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {top5ResourceSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="text-primary" />
              <CardTitle className="font-headline">Top 5 Learning Resources</CardTitle>
            </div>
            <CardDescription>Here are some resources to help you bridge your most critical skill gaps.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {top5ResourceSuggestions.map((suggestion) => (
                <AccordionItem key={suggestion.skill} value={suggestion.skill}>
                  <AccordionTrigger className="text-lg font-semibold">{suggestion.skill}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold mb-2">Websites</h4>
                            <ul className="list-disc pl-5 space-y-2">
                            {suggestion.websites && suggestion.websites.map((site, index) => (
                                <li key={index}>
                                <a href={site.startsWith('http') ? site : `https://${site}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {new URL(site.startsWith('http') ? site : `https://${site}`).hostname}
                                </a>
                                </li>
                            ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">YouTube Channels</h4>
                            <ul className="list-disc pl-5 space-y-2">
                            {suggestion.youtubeChannels && suggestion.youtubeChannels.map((channel, index) => (
                                <li key={index}>
                                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(channel)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {channel}
                                </a>
                                </li>
                            ))}
                            </ul>
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Card>
          <CardHeader>
            <CardTitle className="font-headline">Full Skill List</CardTitle>
            <CardDescription>This is the complete list of skills required for the job. Click any skill to find learning resources.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="all-skills">
                    <AccordionTrigger className="text-lg font-semibold">View all {result.jobSkills.length} skills</AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {result.jobSkills.map((skill) => (
                                <a 
                                  key={skill}
                                  href={`https://www.google.com/search?q=learn+${encodeURIComponent(skill)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="transition-transform hover:scale-105"
                                >
                                  <Badge 
                                      variant={matchedSkillsSet.has(skill.toLowerCase()) ? 'secondary' : 'outline'}
                                      className="text-base cursor-pointer"
                                  >
                                      {skill}
                                  </Badge>
                                </a>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
    </div>
  );
}

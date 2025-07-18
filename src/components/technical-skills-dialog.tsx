"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit } from "lucide-react";

interface TechnicalSkillsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  skills: string[];
  role: string;
  experience: string;
}

export function TechnicalSkillsDialog({
  isOpen,
  setIsOpen,
  skills,
  role,
  experience,
}: TechnicalSkillsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            Major Technical Skills
          </DialogTitle>
          <DialogDescription>
            For a {experience} {role}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-base py-1 px-3">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Could not determine major technical skills for this role.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

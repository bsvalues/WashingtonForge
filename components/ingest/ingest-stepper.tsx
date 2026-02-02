"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IngestStep } from "@/app/ingest/page";

interface IngestStepperProps {
  steps: { id: IngestStep; label: string }[];
  currentStep: IngestStep;
}

export function IngestStepper({ steps, currentStep }: IngestStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isCompleted
                      ? "bg-primary/20 border-2 border-primary text-primary"
                      : isCurrent
                        ? "bg-primary/10 border-2 border-primary text-primary"
                        : "bg-muted/30 border-2 border-border/50 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium",
                    isCurrent || isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4",
                    index < currentIndex ? "bg-primary/50" : "bg-border/50"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="tf-glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all",
                    isCompleted
                      ? "bg-primary/20 border-primary text-primary border-2"
                      : isCurrent
                        ? "bg-primary/10 border-primary text-primary border-2"
                        : "bg-muted/30 border-border/50 text-muted-foreground border-2"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium",
                    isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-0.5 flex-1",
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

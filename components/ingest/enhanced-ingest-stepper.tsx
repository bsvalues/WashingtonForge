"use client";

import { Check, Upload, Link2, ShieldCheck, Eye, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IngestStep } from "@/app/ingest/page";

interface EnhancedIngestStepperProps {
  steps: { id: IngestStep; label: string; description: string }[];
  currentStep: IngestStep;
}

const stepIcons: Record<IngestStep, React.ElementType> = {
  upload: Upload,
  map: Link2,
  validate: ShieldCheck,
  preview: Eye,
  publish: Rocket,
};

export function EnhancedIngestStepper({ steps, currentStep }: EnhancedIngestStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="tf-glass rounded-2xl p-6">
      {/* Desktop view */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = step.id === currentStep;
            const Icon = stepIcons[step.id];

            return (
              <div key={step.id} className="flex flex-1 items-start">
                <div className="flex flex-col items-center text-center">
                  {/* Step Circle with Icon */}
                  <div
                    className={cn(
                      "relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                      isCompleted
                        ? "bg-chart-1/20 text-chart-1 shadow-chart-1/20 shadow-lg"
                        : isCurrent
                          ? "bg-primary/20 text-primary ring-primary/30 ring-2 ring-offset-2 ring-offset-transparent"
                          : "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6" strokeWidth={2.5} />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}

                    {/* Pulse animation for current step */}
                    {isCurrent && (
                      <span className="bg-primary/30 absolute inset-0 animate-ping rounded-2xl opacity-75" />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "mt-3 text-sm font-semibold transition-colors",
                      isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>

                  {/* Description */}
                  <span
                    className={cn(
                      "mt-1 text-xs transition-colors",
                      isCurrent ? "text-primary" : "text-muted-foreground/70"
                    )}
                  >
                    {step.description}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="mx-4 mt-7 flex-1">
                    <div
                      className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        index < currentIndex
                          ? "from-chart-1/60 to-chart-1/40 bg-gradient-to-r"
                          : "bg-border/50"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile view - compact */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = step.id === currentStep;
            const Icon = stepIcons[step.id];

            return (
              <div key={step.id} className="flex flex-1 flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                    isCompleted
                      ? "bg-chart-1/20 text-chart-1"
                      : isCurrent
                        ? "bg-primary/20 text-primary ring-primary/30 ring-2"
                        : "bg-muted/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {isCurrent && (
                  <span className="text-foreground mt-2 text-xs font-medium">{step.label}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Current step description on mobile */}
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-sm">{steps[currentIndex]?.description}</p>
        </div>
      </div>
    </div>
  );
}

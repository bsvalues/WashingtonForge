"use client";

import { useState } from "react";
import {
  Lightbulb,
  X,
  FileSpreadsheet,
  Link2,
  ShieldCheck,
  Eye,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IngestQuickStartProps {
  onDismiss?: () => void;
}

const quickStartSteps = [
  {
    icon: FileSpreadsheet,
    title: "Choose Data Type & Upload",
    description: "Select what kind of data you're uploading (Parcel, Sales, Building, or Assessment), then drag and drop your file.",
  },
  {
    icon: Link2,
    title: "Map Your Fields",
    description: "TerraFusion auto-maps common column names. Review the mappings and adjust any that need correction.",
  },
  {
    icon: ShieldCheck,
    title: "Validate Data Quality",
    description: "Our validation engine checks for missing values, format issues, and data ranges. Fix errors or proceed with warnings.",
  },
  {
    icon: Eye,
    title: "Preview Results",
    description: "Review a sample of your mapped data to ensure everything looks correct before publishing.",
  },
  {
    icon: Rocket,
    title: "Publish to Pipeline",
    description: "Once published, your data enters the FusionCore pipeline for ratio studies and compliance analysis.",
  },
];

export function IngestQuickStart({ onDismiss }: IngestQuickStartProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <div className="tf-glass relative mb-6 overflow-hidden rounded-xl border border-amber-400/20 bg-amber-400/5 p-6">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground absolute right-4 top-4 transition-colors"
        aria-label="Dismiss quick start guide"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/20">
          <Lightbulb className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-foreground font-semibold">Quick Start Guide</h3>
          <p className="text-muted-foreground text-sm">
            New to data ingest? Here's how it works:
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {quickStartSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/30">
                <Icon className="text-muted-foreground h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">
                  {index + 1}. {step.title}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
              {index < quickStartSteps.length - 1 && (
                <ChevronRight className="text-muted-foreground/30 hidden h-5 w-5 shrink-0 self-center lg:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="mt-6 flex flex-wrap gap-2 border-t border-amber-400/20 pt-4">
        <span className="text-muted-foreground text-xs">Tips:</span>
        <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground">
          CSV files should have headers
        </span>
        <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground">
          Geometry can be WKT or GeoJSON
        </span>
        <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs text-muted-foreground">
          Max file size: 100MB
        </span>
      </div>
    </div>
  );
}

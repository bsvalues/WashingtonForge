"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, CheckCircle2, Rocket, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/material";
import { publishDataset, type Dataset } from "@/lib/api";

interface PublishStepProps {
  dataset: Dataset;
  onComplete: () => void;
  onBack: () => void;
}

export function PublishStep({ dataset, onComplete, onBack }: PublishStepProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      await publishDataset(dataset.id);
      setIsPublished(true);
    } catch (err) {
      console.error("[v0] Publish error:", err);
      setError("Failed to publish dataset. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isPublished) {
    return (
      <div className="tf-glass rounded-xl p-12 text-center">
        <div className="bg-chart-1/20 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <CheckCircle2 className="text-chart-1 h-10 w-10" />
        </div>
        <h3 className="text-foreground mb-2 text-2xl font-semibold">Dataset Published</h3>
        <p className="text-muted-foreground mx-auto mb-8 max-w-md">
          Your dataset has been successfully published to the FusionCore pipeline. It will now be
          processed and integrated into the valuation system.
        </p>

        <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
          <div className="tf-glass rounded-lg p-4">
            <p className="text-foreground text-lg font-semibold">
              {dataset.rowCount?.toLocaleString() || "—"}
            </p>
            <p className="text-muted-foreground text-sm">Records Ingested</p>
          </div>
          <div className="tf-glass rounded-lg p-4">
            <p className="text-foreground text-lg font-semibold capitalize">{dataset.type}</p>
            <p className="text-muted-foreground text-sm">Dataset Type</p>
          </div>
          <div className="tf-glass rounded-lg p-4">
            <p className="text-chart-1 text-lg font-semibold">Active</p>
            <p className="text-muted-foreground text-sm">Status</p>
          </div>
        </div>

        <Button onClick={onComplete} className="tf-glass-btn tf-glass-btn--primary text-foreground px-8 font-medium">
          Upload Another Dataset
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pre-publish Summary */}
      <div className="tf-glass rounded-xl p-8 text-center">
        <div className="bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
          <Rocket className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-foreground mb-2 text-xl font-semibold">Ready to Publish</h3>
        <p className="text-muted-foreground mx-auto max-w-lg">
          Your dataset has been validated and mapped. Publishing will make it available in the
          FusionCore pipeline for valuation processing.
        </p>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="tf-glass rounded-xl p-6">
          <div className="mb-3 flex items-center gap-3">
            <CheckCircle2 className="text-chart-1 h-5 w-5" />
            <span className="text-foreground font-medium">Validation</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Data quality checks completed with {dataset.rowCount?.toLocaleString() || "—"} valid
            rows
          </p>
        </div>

        <div className="tf-glass rounded-xl p-6">
          <div className="mb-3 flex items-center gap-3">
            <CheckCircle2 className="text-chart-1 h-5 w-5" />
            <span className="text-foreground font-medium">Field Mapping</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Source fields mapped to TerraFusion schema
          </p>
        </div>

        <div className="tf-glass rounded-xl p-6">
          <div className="mb-3 flex items-center gap-3">
            <Shield className="text-primary h-5 w-5" />
            <span className="text-foreground font-medium">Audit Trail</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Immutable record will be created upon publish
          </p>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="tf-glass flex items-start gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <Clock className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
        <div>
          <p className="text-foreground font-medium">Before You Publish</p>
          <p className="text-muted-foreground text-sm">
            Once published, this dataset will be versioned and locked. Changes will require
            uploading a new version. Make sure all data is correct before proceeding.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-4 text-center">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isPublishing}
          className="tf-glass-btn border-border/50 text-foreground bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <GlassButton
          onClick={handlePublish}
          tone="primary"
          disabled={isPublishing}
          className="text-foreground px-8 font-medium"
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Publish Dataset
            </>
          )}
        </GlassButton>
      </div>
    </div>
  );
}

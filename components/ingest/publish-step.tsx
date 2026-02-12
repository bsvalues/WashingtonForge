"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Rocket,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommitmentButton } from "@/components/ui/commitment-button";
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
      <div className="glass-panel rounded-xl p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-chart-1/20 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-chart-1" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          Dataset Published
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Your dataset has been successfully published to the FusionCore
          pipeline. It will now be processed and integrated into the valuation
          system.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          <div className="glass-panel rounded-lg p-4">
            <p className="text-lg font-semibold text-foreground">
              {dataset.rowCount?.toLocaleString() || "—"}
            </p>
            <p className="text-sm text-muted-foreground">Records Ingested</p>
          </div>
          <div className="glass-panel rounded-lg p-4">
            <p className="text-lg font-semibold text-foreground capitalize">
              {dataset.type}
            </p>
            <p className="text-sm text-muted-foreground">Dataset Type</p>
          </div>
          <div className="glass-panel rounded-lg p-4">
            <p className="text-lg font-semibold text-chart-1">Active</p>
            <p className="text-sm text-muted-foreground">Status</p>
          </div>
        </div>

        <Button
          onClick={onComplete}
          className="glass-btn-primary text-foreground font-medium px-8"
        >
          Upload Another Dataset
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pre-publish Summary */}
      <div className="glass-panel rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Ready to Publish
        </h3>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Your dataset has been validated and mapped. Publishing will make it
          available in the FusionCore pipeline for valuation processing.
        </p>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-chart-1" />
            <span className="font-medium text-foreground">Validation</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Data quality checks completed with {dataset.rowCount?.toLocaleString() || "—"} valid rows
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-chart-1" />
            <span className="font-medium text-foreground">Field Mapping</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Source fields mapped to TerraFusion schema
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Audit Trail</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Immutable record will be created upon publish
          </p>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="glass-panel rounded-xl p-4 flex items-start gap-4 border border-amber-500/30 bg-amber-500/5">
        <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Before You Publish</p>
          <p className="text-sm text-muted-foreground">
            Once published, this dataset will be versioned and locked. Changes
            will require uploading a new version. Make sure all data is correct
            before proceeding.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-center">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isPublishing}
          className="glass-btn border-border/50 text-foreground bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <CommitmentButton
          onClick={handlePublish}
          disabled={isPublishing}
          loading={isPublishing}
          icon={<Rocket className="w-4 h-4" />}
          className="px-8"
        >
          {isPublishing ? "Publishing..." : "Publish Dataset"}
        </CommitmentButton>
      </div>
    </div>
  );
}

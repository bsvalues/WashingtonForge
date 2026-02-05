"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { EnhancedIngestStepper } from "@/components/ingest/enhanced-ingest-stepper";
import { SmartUploadStep } from "@/components/ingest/smart-upload-step";
import { SmartMapFieldsStep } from "@/components/ingest/smart-map-fields-step";
import { ValidateStep } from "@/components/ingest/validate-step";
import { PreviewStep } from "@/components/ingest/preview-step";
import { PublishStep } from "@/components/ingest/publish-step";
import { IngestQuickStart } from "@/components/ingest/ingest-quick-start";
import type { Dataset, ValidationResult, FieldMapping } from "@/lib/api";

// FIXED: Correct step order is Upload → Map → Validate → Preview → Publish
// You must map fields BEFORE validating (need to know what fields mean to validate them)
export type IngestStep = "upload" | "map" | "validate" | "preview" | "publish";

const steps: { id: IngestStep; label: string; description: string }[] = [
  { id: "upload", label: "Upload", description: "Select your data file" },
  { id: "map", label: "Map Fields", description: "Connect columns to schema" },
  { id: "validate", label: "Validate", description: "Check data quality" },
  { id: "preview", label: "Preview", description: "Review mapped data" },
  { id: "publish", label: "Publish", description: "Make it official" },
];

export default function IngestPage() {
  const [currentStep, setCurrentStep] = useState<IngestStep>("upload");
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);

  // Step handlers with correct flow: Upload → Map → Validate → Preview → Publish
  const handleUploadComplete = useCallback((uploadedDataset: Dataset) => {
    setDataset(uploadedDataset);
    setCurrentStep("map"); // Go to mapping after upload
  }, []);

  const handleMappingComplete = useCallback((mappings: FieldMapping[]) => {
    setFieldMappings(mappings);
    setCurrentStep("validate"); // Go to validation after mapping
  }, []);

  const handleValidationComplete = useCallback((result: ValidationResult) => {
    setValidationResult(result);
    setCurrentStep("preview");
  }, []);

  const handlePreviewComplete = useCallback(() => {
    setCurrentStep("publish");
  }, []);

  const handlePublishComplete = useCallback(() => {
    // Reset for next upload
    setDataset(null);
    setValidationResult(null);
    setFieldMappings([]);
    setCurrentStep("upload");
  }, []);

  const goBack = useCallback(() => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  }, [currentStep]);

  return (
    <AppShell user={{ name: "Demo User", role: "Assessor", county: "Benton County" }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold tracking-tight">Data Ingest</h1>
          <p className="text-muted-foreground">
            Import property data into TerraFusion with guided validation and field mapping
          </p>
        </div>

        {/* Quick Start Guide - shows on upload step only */}
        {currentStep === "upload" && <IngestQuickStart />}

        {/* Enhanced Stepper */}
        <div className="mb-8">
          <EnhancedIngestStepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {currentStep === "upload" && (
            <SmartUploadStep onComplete={handleUploadComplete} />
          )}
          
          {currentStep === "map" && dataset && (
            <SmartMapFieldsStep
              dataset={dataset}
              onComplete={handleMappingComplete}
              onBack={goBack}
            />
          )}
          
          {currentStep === "validate" && dataset && (
            <ValidateStep
              dataset={dataset}
              onComplete={handleValidationComplete}
              onBack={goBack}
            />
          )}
          
          {currentStep === "preview" && dataset && (
            <PreviewStep
              dataset={dataset}
              fieldMappings={fieldMappings}
              onComplete={handlePreviewComplete}
              onBack={goBack}
            />
          )}
          
          {currentStep === "publish" && dataset && (
            <PublishStep
              dataset={dataset}
              onComplete={handlePublishComplete}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

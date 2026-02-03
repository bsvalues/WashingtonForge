"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { IngestStepper } from "@/components/ingest/ingest-stepper";
import { UploadStep } from "@/components/ingest/upload-step";
import { ValidateStep } from "@/components/ingest/validate-step";
import { MapFieldsStep } from "@/components/ingest/map-fields-step";
import { PreviewStep } from "@/components/ingest/preview-step";
import { PublishStep } from "@/components/ingest/publish-step";
import type { Dataset, ValidationResult, FieldMapping } from "@/lib/api";

export type IngestStep = "upload" | "validate" | "map" | "preview" | "publish";

const steps: { id: IngestStep; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "validate", label: "Validate" },
  { id: "map", label: "Map Fields" },
  { id: "preview", label: "Preview" },
  { id: "publish", label: "Publish" },
];

export default function IngestPage() {
  const [currentStep, setCurrentStep] = useState<IngestStep>("upload");
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);

  const handleUploadComplete = (uploadedDataset: Dataset) => {
    setDataset(uploadedDataset);
    setCurrentStep("validate");
  };

  const handleValidationComplete = (result: ValidationResult) => {
    setValidationResult(result);
    setCurrentStep("map");
  };

  const handleMappingComplete = (mappings: FieldMapping[]) => {
    setFieldMappings(mappings);
    setCurrentStep("preview");
  };

  const handlePreviewComplete = () => {
    setCurrentStep("publish");
  };

  const handlePublishComplete = () => {
    // Reset for next upload
    setDataset(null);
    setValidationResult(null);
    setFieldMappings([]);
    setCurrentStep("upload");
  };

  const goBack = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  return (
    <AppShell user={{ name: "Jane Doe", role: "Assessor", county: "Benton County" }}>
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-2xl font-semibold">Data Ingestion</h1>
          <p className="text-muted-foreground">
            Upload and validate county data files for the FusionCore pipeline
          </p>
        </div>

        {/* Stepper */}
        <IngestStepper steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === "upload" && <UploadStep onComplete={handleUploadComplete} />}
          {currentStep === "validate" && dataset && (
            <ValidateStep dataset={dataset} onComplete={handleValidationComplete} onBack={goBack} />
          )}
          {currentStep === "map" && dataset && validationResult && (
            <MapFieldsStep dataset={dataset} onComplete={handleMappingComplete} onBack={goBack} />
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
            <PublishStep dataset={dataset} onComplete={handlePublishComplete} onBack={goBack} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

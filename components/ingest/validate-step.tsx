"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileWarning,
  Hash,
  Calendar,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  validateDataset,
  downloadErrorCsv,
  type Dataset,
  type ValidationResult,
  type ValidationError,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface ValidateStepProps {
  dataset: Dataset;
  onComplete: (result: ValidationResult) => void;
  onBack: () => void;
}

// Categorize errors by type
function categorizeErrors(errors: ValidationError[]) {
  const categories: Record<string, ValidationError[]> = {
    missing: [],
    format: [],
    range: [],
    geometry: [],
    other: [],
  };

  for (const err of errors) {
    const msg = err.message.toLowerCase();
    if (msg.includes("required") || msg.includes("missing") || err.value === "") {
      categories.missing.push(err);
    } else if (msg.includes("format") || msg.includes("invalid")) {
      categories.format.push(err);
    } else if (msg.includes("range") || msg.includes("must be") || msg.includes("positive")) {
      categories.range.push(err);
    } else if (msg.includes("geometry") || msg.includes("coordinate")) {
      categories.geometry.push(err);
    } else {
      categories.other.push(err);
    }
  }

  return categories;
}

export function ValidateStep({ dataset, onComplete, onBack }: ValidateStepProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationStage, setValidationStage] = useState("Initializing...");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeErrorTab, setActiveErrorTab] = useState("all");

  useEffect(() => {
    async function runValidation() {
      // Simulate staged validation with progress
      const stages = [
        { stage: "Checking file structure...", progress: 10 },
        { stage: "Validating required fields...", progress: 30 },
        { stage: "Verifying data formats...", progress: 50 },
        { stage: "Checking value ranges...", progress: 70 },
        { stage: "Validating geometry data...", progress: 85 },
        { stage: "Generating report...", progress: 95 },
      ];

      for (const { stage, progress } of stages) {
        setValidationStage(stage);
        setValidationProgress(progress);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      try {
        const validationResult = await validateDataset(dataset.id);
        setValidationProgress(100);
        setValidationStage("Complete");
        await new Promise((resolve) => setTimeout(resolve, 300));
        setResult(validationResult);
      } catch (err) {
        console.error("[v0] Validation error:", err);
        setError("Failed to validate dataset. Please try again.");
      } finally {
        setIsValidating(false);
      }
    }
    runValidation();
  }, [dataset.id]);

  const handleDownloadErrors = async () => {
    try {
      const blob = await downloadErrorCsv(dataset.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataset.name}_errors.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[v0] Download error:", err);
    }
  };

  const handleContinue = () => {
    if (result) {
      onComplete(result);
    }
  };

  if (isValidating) {
    return (
      <div className="tf-glass rounded-xl p-12">
        <div className="mx-auto max-w-md text-center">
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="border-primary/20 absolute inset-0 rounded-full border-4" />
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="oklch(0.7 0.15 200)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${validationProgress * 2.89} 289`}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-foreground text-lg font-semibold">{validationProgress}%</span>
            </div>
          </div>
          <h3 className="text-foreground mb-2 text-lg font-medium">Validating Dataset</h3>
          <p className="text-muted-foreground mb-6">{validationStage}</p>
          <Progress value={validationProgress} className="h-2" />
          <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
            <div
              className={cn(
                "rounded-lg p-2",
                validationProgress >= 30
                  ? "bg-chart-1/20 text-chart-1"
                  : "bg-muted/20 text-muted-foreground"
              )}
            >
              <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
              Structure
            </div>
            <div
              className={cn(
                "rounded-lg p-2",
                validationProgress >= 70
                  ? "bg-chart-1/20 text-chart-1"
                  : "bg-muted/20 text-muted-foreground"
              )}
            >
              <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
              Data Quality
            </div>
            <div
              className={cn(
                "rounded-lg p-2",
                validationProgress >= 95
                  ? "bg-chart-1/20 text-chart-1"
                  : "bg-muted/20 text-muted-foreground"
              )}
            >
              <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
              Geometry
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tf-glass rounded-xl p-12 text-center">
        <XCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
        <h3 className="text-foreground mb-2 text-lg font-medium">Validation Failed</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button
          variant="outline"
          onClick={onBack}
          className="tf-glass-btn border-border/50 text-foreground bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!result) return null;

  const hasErrors = result.rejectedRows > 0;
  const acceptRate = ((result.acceptedRows / result.totalRows) * 100).toFixed(1);
  const errorCategories = categorizeErrors(result.errors);

  const categoryInfo = [
    {
      key: "missing",
      label: "Missing Required",
      icon: FileWarning,
      count: errorCategories.missing.length,
    },
    { key: "format", label: "Invalid Format", icon: Hash, count: errorCategories.format.length },
    { key: "range", label: "Value Range", icon: DollarSign, count: errorCategories.range.length },
    { key: "geometry", label: "Geometry", icon: MapPin, count: errorCategories.geometry.length },
  ].filter((c) => c.count > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="tf-glass rounded-xl p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-primary/20 flex h-9 w-9 items-center justify-center rounded-lg">
              <Hash className="text-primary h-4 w-4" />
            </div>
            <span className="text-muted-foreground text-sm">Total Rows</span>
          </div>
          <p className="text-foreground text-2xl font-semibold">
            {result.totalRows.toLocaleString()}
          </p>
        </div>

        <div className="tf-glass rounded-xl p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-chart-1/20 flex h-9 w-9 items-center justify-center rounded-lg">
              <CheckCircle2 className="text-chart-1 h-4 w-4" />
            </div>
            <span className="text-muted-foreground text-sm">Accepted</span>
          </div>
          <p className="text-chart-1 text-2xl font-semibold">
            {result.acceptedRows.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-xs">{acceptRate}% pass rate</p>
        </div>

        <div className="tf-glass rounded-xl p-5">
          <div className="mb-2 flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                hasErrors ? "bg-destructive/20" : "bg-chart-1/20"
              )}
            >
              {hasErrors ? (
                <XCircle className="text-destructive h-4 w-4" />
              ) : (
                <CheckCircle2 className="text-chart-1 h-4 w-4" />
              )}
            </div>
            <span className="text-muted-foreground text-sm">Rejected</span>
          </div>
          <p
            className={cn(
              "text-2xl font-semibold",
              hasErrors ? "text-destructive" : "text-foreground"
            )}
          >
            {result.rejectedRows.toLocaleString()}
          </p>
        </div>

        <div className="tf-glass rounded-xl p-5">
          <div className="mb-2 flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                hasErrors ? "bg-amber-500/20" : "bg-chart-1/20"
              )}
            >
              <AlertTriangle
                className={cn("h-4 w-4", hasErrors ? "text-amber-500" : "text-chart-1")}
              />
            </div>
            <span className="text-muted-foreground text-sm">Errors</span>
          </div>
          <p
            className={cn(
              "text-2xl font-semibold",
              hasErrors ? "text-amber-500" : "text-foreground"
            )}
          >
            {result.errors.length}
          </p>
        </div>
      </div>

      {/* Status Message */}
      <div
        className={cn(
          "tf-glass flex items-center gap-4 rounded-xl p-4",
          hasErrors
            ? "border border-amber-500/30 bg-amber-500/5"
            : "border-chart-1/30 bg-chart-1/5 border"
        )}
      >
        {hasErrors ? (
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
        ) : (
          <CheckCircle2 className="text-chart-1 h-6 w-6 shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-foreground font-medium">
            {hasErrors ? "Validation completed with warnings" : "All rows validated successfully"}
          </p>
          <p className="text-muted-foreground text-sm">
            {hasErrors
              ? `${result.acceptedRows.toLocaleString()} rows will be imported. ${result.rejectedRows} rows with errors will be skipped.`
              : "Your data is ready for field mapping"}
          </p>
        </div>
        {hasErrors && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadErrors}
            className="tf-glass-btn border-border/50 text-foreground shrink-0 bg-transparent"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Errors
          </Button>
        )}
      </div>

      {/* Error Categories */}
      {hasErrors && categoryInfo.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categoryInfo.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveErrorTab(key)}
              className={cn(
                "tf-glass rounded-lg p-3 text-left transition-all",
                activeErrorTab === key
                  ? "border-primary/50 bg-primary/10 border"
                  : "hover:bg-muted/20"
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <Icon className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-xs">{label}</span>
              </div>
              <p className="text-foreground text-lg font-semibold">{count}</p>
            </button>
          ))}
        </div>
      )}

      {/* Error Table with Tabs */}
      {hasErrors && result.errors.length > 0 && (
        <div className="tf-glass overflow-hidden rounded-xl">
          <Tabs value={activeErrorTab} onValueChange={setActiveErrorTab}>
            <div className="border-border/50 flex items-center justify-between border-b p-4">
              <TabsList className="bg-muted/30">
                <TabsTrigger
                  value="all"
                  className="text-foreground data-[state=active]:bg-primary/20"
                >
                  All ({result.errors.length})
                </TabsTrigger>
                {categoryInfo.map(({ key, label, count }) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="text-foreground data-[state=active]:bg-primary/20"
                  >
                    {label} ({count})
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="max-h-72 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground w-20">Row</TableHead>
                    <TableHead className="text-muted-foreground">Field</TableHead>
                    <TableHead className="text-muted-foreground">Value</TableHead>
                    <TableHead className="text-muted-foreground">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TabsContent value="all" className="m-0">
                    {result.errors.slice(0, 50).map((err, idx) => (
                      <ErrorRow key={idx} error={err} />
                    ))}
                  </TabsContent>
                  {Object.entries(errorCategories).map(([key, errors]) => (
                    <TabsContent key={key} value={key} className="m-0">
                      {errors.slice(0, 50).map((err, idx) => (
                        <ErrorRow key={idx} error={err} />
                      ))}
                    </TabsContent>
                  ))}
                </TableBody>
              </Table>
            </div>

            {result.errors.length > 50 && (
              <div className="border-border/50 text-muted-foreground border-t p-3 text-center text-sm">
                Showing first 50 errors. Download CSV for complete report.
              </div>
            )}
          </Tabs>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="tf-glass-btn border-border/50 text-foreground bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} className="tf-glass-btn tf-glass-btn--primary text-foreground font-medium">
          Continue to Preview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ErrorRow({ error }: { error: ValidationError }) {
  return (
    <TableRow className="border-border/50">
      <TableCell className="text-foreground font-mono text-sm">{error.row}</TableCell>
      <TableCell className="text-foreground">{error.field}</TableCell>
      <TableCell className="text-muted-foreground max-w-32 truncate font-mono text-xs">
        {error.value || <span className="italic">empty</span>}
      </TableCell>
      <TableCell className="text-destructive text-sm">{error.message}</TableCell>
    </TableRow>
  );
}

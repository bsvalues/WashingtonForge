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

export function ValidateStep({
  dataset,
  onComplete,
  onBack,
}: ValidateStepProps) {
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
      <div className="glass-panel rounded-xl p-12">
        <div className="max-w-md mx-auto text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
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
              <span className="text-lg font-semibold text-foreground">
                {validationProgress}%
              </span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Validating Dataset
          </h3>
          <p className="text-muted-foreground mb-6">{validationStage}</p>
          <Progress value={validationProgress} className="h-2" />
          <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
            <div className={cn(
              "p-2 rounded-lg",
              validationProgress >= 30 ? "bg-chart-1/20 text-chart-1" : "bg-muted/20 text-muted-foreground"
            )}>
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
              Structure
            </div>
            <div className={cn(
              "p-2 rounded-lg",
              validationProgress >= 70 ? "bg-chart-1/20 text-chart-1" : "bg-muted/20 text-muted-foreground"
            )}>
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
              Data Quality
            </div>
            <div className={cn(
              "p-2 rounded-lg",
              validationProgress >= 95 ? "bg-chart-1/20 text-chart-1" : "bg-muted/20 text-muted-foreground"
            )}>
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
              Geometry
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center">
        <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Validation Failed
        </h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button
          variant="outline"
          onClick={onBack}
          className="glass-btn border-border/50 text-foreground bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
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
    { key: "missing", label: "Missing Required", icon: FileWarning, count: errorCategories.missing.length },
    { key: "format", label: "Invalid Format", icon: Hash, count: errorCategories.format.length },
    { key: "range", label: "Value Range", icon: DollarSign, count: errorCategories.range.length },
    { key: "geometry", label: "Geometry", icon: MapPin, count: errorCategories.geometry.length },
  ].filter(c => c.count > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Hash className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Rows</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {result.totalRows.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-chart-1/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-chart-1" />
            </div>
            <span className="text-sm text-muted-foreground">Accepted</span>
          </div>
          <p className="text-2xl font-semibold text-chart-1">
            {result.acceptedRows.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{acceptRate}% pass rate</p>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              hasErrors ? "bg-destructive/20" : "bg-chart-1/20"
            )}>
              {hasErrors ? (
                <XCircle className="w-4 h-4 text-destructive" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-chart-1" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">Rejected</span>
          </div>
          <p className={cn(
            "text-2xl font-semibold",
            hasErrors ? "text-destructive" : "text-foreground"
          )}>
            {result.rejectedRows.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              hasErrors ? "bg-amber-500/20" : "bg-chart-1/20"
            )}>
              <AlertTriangle className={cn(
                "w-4 h-4",
                hasErrors ? "text-amber-500" : "text-chart-1"
              )} />
            </div>
            <span className="text-sm text-muted-foreground">Errors</span>
          </div>
          <p className={cn(
            "text-2xl font-semibold",
            hasErrors ? "text-amber-500" : "text-foreground"
          )}>
            {result.errors.length}
          </p>
        </div>
      </div>

      {/* Status Message */}
      <div className={cn(
        "glass-panel rounded-xl p-4 flex items-center gap-4",
        hasErrors
          ? "border border-amber-500/30 bg-amber-500/5"
          : "border border-chart-1/30 bg-chart-1/5"
      )}>
        {hasErrors ? (
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
        ) : (
          <CheckCircle2 className="w-6 h-6 text-chart-1 shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {hasErrors
              ? "Validation completed with warnings"
              : "All rows validated successfully"}
          </p>
          <p className="text-sm text-muted-foreground">
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
            className="glass-btn border-border/50 text-foreground bg-transparent shrink-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Errors
          </Button>
        )}
      </div>

      {/* Error Categories */}
      {hasErrors && categoryInfo.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categoryInfo.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveErrorTab(key)}
              className={cn(
                "glass-panel rounded-lg p-3 text-left transition-all",
                activeErrorTab === key
                  ? "border border-primary/50 bg-primary/10"
                  : "hover:bg-muted/20"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{count}</p>
            </button>
          ))}
        </div>
      )}

      {/* Error Table with Tabs */}
      {hasErrors && result.errors.length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <Tabs value={activeErrorTab} onValueChange={setActiveErrorTab}>
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <TabsList className="bg-muted/30">
                <TabsTrigger value="all" className="text-foreground data-[state=active]:bg-primary/20">
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
              <div className="p-3 border-t border-border/50 text-center text-sm text-muted-foreground">
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
          className="glass-btn border-border/50 text-foreground bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="glass-btn-primary text-foreground font-medium"
        >
          Continue to Field Mapping
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ErrorRow({ error }: { error: ValidationError }) {
  return (
    <TableRow className="border-border/50">
      <TableCell className="text-foreground font-mono text-sm">
        {error.row}
      </TableCell>
      <TableCell className="text-foreground">{error.field}</TableCell>
      <TableCell className="text-muted-foreground font-mono text-xs max-w-32 truncate">
        {error.value || <span className="italic">empty</span>}
      </TableCell>
      <TableCell className="text-destructive text-sm">
        {error.message}
      </TableCell>
    </TableRow>
  );
}

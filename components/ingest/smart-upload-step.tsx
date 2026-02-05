"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  MapIcon,
  Archive,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  FileSpreadsheet,
  Building2,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uploadDataset, type Dataset, type DatasetType } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SmartUploadStepProps {
  onComplete: (dataset: Dataset) => void;
}

const datasetTypes: {
  value: DatasetType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  examples: string[];
}[] = [
  {
    value: "parcel",
    label: "Parcel Master",
    description: "Primary parcel inventory with ownership and legal descriptions",
    icon: MapIcon,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    examples: ["PARID", "SITUS_ADDR", "LEGAL_DESC", "OWNER_NAME"],
  },
  {
    value: "sales",
    label: "Sales Records",
    description: "Arm's-length transactions for ratio study analysis",
    icon: DollarSign,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    examples: ["SALE_PRICE", "SALE_DATE", "DEED_TYPE", "GRANTOR"],
  },
  {
    value: "building",
    label: "Building Data",
    description: "Structural characteristics and improvements",
    icon: Building2,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    examples: ["YEAR_BUILT", "SQ_FT", "BEDROOMS", "QUALITY_GRADE"],
  },
  {
    value: "assessment",
    label: "Assessment Roll",
    description: "Current year values and exemptions",
    icon: ClipboardList,
    color: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    examples: ["LAND_VALUE", "IMP_VALUE", "EXEMPTION_AMT", "TAX_STATUS"],
  },
];

const acceptedFormats = [
  { ext: ".csv", icon: FileSpreadsheet, label: "CSV", desc: "Comma-separated values" },
  { ext: ".geojson", icon: MapIcon, label: "GeoJSON", desc: "With geometry data" },
  { ext: ".zip", icon: Archive, label: "Shapefile", desc: "Zipped .shp bundle" },
];

export function SmartUploadStep({ onComplete }: SmartUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [datasetType, setDatasetType] = useState<DatasetType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<DatasetType | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }, []);

  const validateAndSetFile = (f: File) => {
    const validExtensions = [".csv", ".geojson", ".json", ".zip"];
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));

    if (!validExtensions.includes(ext)) {
      setError("Invalid file type. Please upload CSV, GeoJSON, or ZIP files.");
      return;
    }

    setError(null);
    setFile(f);

    // Smart type detection based on filename
    const filename = f.name.toLowerCase();
    if (filename.includes("sale") || filename.includes("trans")) {
      setDetectedType("sales");
      if (!datasetType) setDatasetType("sales");
    } else if (filename.includes("building") || filename.includes("improve")) {
      setDetectedType("building");
      if (!datasetType) setDatasetType("building");
    } else if (filename.includes("assess") || filename.includes("roll")) {
      setDetectedType("assessment");
      if (!datasetType) setDatasetType("assessment");
    } else if (filename.includes("parcel") || filename.includes("master")) {
      setDetectedType("parcel");
      if (!datasetType) setDatasetType("parcel");
    }
  };

  const handleUpload = async () => {
    if (!file || !datasetType) return;

    setIsUploading(true);
    setError(null);

    try {
      const dataset = await uploadDataset(file, datasetType);
      onComplete(dataset);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setDetectedType(null);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Step 1: Select Dataset Type */}
        <div className="tf-glass rounded-xl p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-primary">
              1
            </div>
            <div>
              <h3 className="text-foreground font-semibold">What type of data are you uploading?</h3>
              <p className="text-muted-foreground text-sm">
                This helps us auto-map fields and apply the right validation rules
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {datasetTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = datasetType === type.value;
              const isDetected = detectedType === type.value && !datasetType;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDatasetType(type.value)}
                  className={cn(
                    "group relative flex flex-col rounded-xl border p-4 text-left transition-all",
                    isSelected
                      ? `${type.color} border-2`
                      : isDetected
                        ? "border-primary/50 bg-primary/5 border-dashed"
                        : "border-border/50 hover:border-border hover:bg-muted/10"
                  )}
                >
                  {isDetected && !isSelected && (
                    <div className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                      <Sparkles className="h-3 w-3" />
                      Detected
                    </div>
                  )}

                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        isSelected ? type.color : "bg-muted/30 text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && <CheckCircle2 className="text-chart-1 h-5 w-5" />}
                  </div>

                  <span
                    className={cn(
                      "font-medium transition-colors",
                      isSelected ? "text-foreground" : "text-foreground/80"
                    )}
                  >
                    {type.label}
                  </span>
                  <span className="text-muted-foreground mt-1 text-xs">{type.description}</span>

                  {/* Example fields on hover */}
                  <div className="text-muted-foreground/70 mt-3 flex flex-wrap gap-1">
                    {type.examples.slice(0, 3).map((ex) => (
                      <span key={ex} className="bg-muted/30 rounded px-1.5 py-0.5 font-mono text-[10px]">
                        {ex}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Upload File */}
        <div className="tf-glass rounded-xl p-6">
          <div className="mb-4 flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                datasetType ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
              )}
            >
              2
            </div>
            <div>
              <h3 className="text-foreground font-semibold">Upload your file</h3>
              <p className="text-muted-foreground text-sm">
                Drag and drop or click to browse
              </p>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={cn(
              "rounded-xl border-2 border-dashed p-8 transition-all",
              !datasetType && "pointer-events-none opacity-50",
              isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-border",
              file && "border-chart-1/30 bg-chart-1/5 border-solid"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-chart-1/20 flex h-14 w-14 items-center justify-center rounded-xl">
                    <FileText className="text-chart-1 h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-foreground text-lg font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-muted/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
                  <Upload className="text-muted-foreground h-8 w-8" />
                </div>
                <p className="text-foreground mb-2 text-lg font-medium">
                  {datasetType ? "Drop your file here" : "Select a data type first"}
                </p>
                <p className="text-muted-foreground mb-6">or click to browse from your computer</p>

                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.geojson,.json,.zip"
                  onChange={handleFileSelect}
                  disabled={!datasetType}
                />
                <label htmlFor="file-upload">
                  <Button
                    asChild
                    variant="outline"
                    disabled={!datasetType}
                    className="tf-glass-btn border-border/50 text-foreground cursor-pointer bg-transparent"
                  >
                    <span>Browse Files</span>
                  </Button>
                </label>

                {/* Accepted Formats */}
                <div className="mt-8 flex items-center justify-center gap-6">
                  {acceptedFormats.map((format) => {
                    const Icon = format.icon;
                    return (
                      <Tooltip key={format.ext}>
                        <TooltipTrigger asChild>
                          <div className="text-muted-foreground flex cursor-help items-center gap-2 text-sm">
                            <Icon className="h-4 w-4" />
                            <span>{format.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format.desc}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-3 rounded-xl border p-4">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Help Card */}
        <div className="tf-glass flex items-start gap-4 rounded-xl border border-blue-400/20 bg-blue-400/5 p-4">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div>
            <p className="text-foreground text-sm font-medium">Need help preparing your data?</p>
            <p className="text-muted-foreground mt-1 text-sm">
              TerraFusion supports standard county export formats. For best results, include a
              header row with column names. Geometry data can be in WKT, GeoJSON, or shapefile format.
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || !datasetType || isUploading}
            size="lg"
            className="tf-glass-btn tf-glass-btn--primary text-foreground px-8 font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload & Continue
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

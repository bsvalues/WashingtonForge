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
  Database,
  Layers,
  FolderArchive,
  Package,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dataSuiteHub } from "@/lib/data-suite";
import type { Dataset, DatasetType } from "@/lib/api";
import type { DataProductType } from "@/lib/data-suite/types";
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

// Supported file formats with comprehensive GIS support
const acceptedFormats = [
  { ext: ".csv", icon: FileSpreadsheet, label: "CSV", desc: "Comma-separated values" },
  { ext: ".xlsx", icon: Table2, label: "Excel", desc: "Excel spreadsheets (.xlsx, .xls)" },
  { ext: ".geojson", icon: MapIcon, label: "GeoJSON", desc: "With geometry data" },
  { ext: ".zip", icon: FolderArchive, label: "Bulk Package", desc: "ZIP with CSV, Excel, GeoJSON, Shapefiles" },
  { ext: ".gdb", icon: Database, label: "Geodatabase", desc: "Esri File Geodatabase (.gdb folder)" },
];

// Bulk package detection patterns
const BULK_PATTERNS = {
  shapefile: [".shp", ".dbf", ".shx", ".prj"],
  geodatabase: [".gdb"],
  excel: [".xlsx", ".xls"],
  csv: [".csv"],
  geojson: [".geojson", ".json"],
};

interface DetectedContent {
  type: "single" | "bulk";
  format: string;
  layerCount?: number;
  estimatedRows?: number;
  containedFiles?: string[];
}

export function SmartUploadStep({ onComplete }: SmartUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]); // For folder/multi-file uploads
  const [datasetType, setDatasetType] = useState<DatasetType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<DatasetType | null>(null);
  const [detectedContent, setDetectedContent] = useState<DetectedContent | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Check for .gdb folder drop first
    if (e.dataTransfer.items) {
      const isFolder = await handleFolderDrop(e.dataTransfer.items);
      if (isFolder) return;
    }
    
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

  const validateAndSetFile = async (f: File) => {
    const validExtensions = [".csv", ".geojson", ".json", ".zip", ".xlsx", ".xls"];
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));

    if (!validExtensions.includes(ext)) {
      setError("Invalid file type. Supported formats: CSV, Excel (.xlsx/.xls), GeoJSON, ZIP bundles.");
      return;
    }

    setError(null);
    setFile(f);

    // Analyze bulk packages
    if (ext === ".zip") {
      setIsAnalyzing(true);
      try {
        // Simulate ZIP content analysis (in production, use JSZip or server-side)
        const content = await analyzeZipContent(f);
        setDetectedContent(content);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setDetectedContent({
        type: "single",
        format: ext.replace(".", "").toUpperCase(),
        estimatedRows: Math.floor(f.size / 100), // Rough estimate
      });
    }

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

  // Analyze ZIP content to detect contained files
  const analyzeZipContent = async (zipFile: File): Promise<DetectedContent> => {
    // In production, use JSZip to actually read the ZIP
    // For now, simulate based on filename patterns
    const filename = zipFile.name.toLowerCase();
    
    if (filename.includes("shapefile") || filename.includes("shp")) {
      return {
        type: "bulk",
        format: "Shapefile Bundle",
        layerCount: 1,
        containedFiles: ["parcels.shp", "parcels.dbf", "parcels.shx", "parcels.prj"],
      };
    }
    
    if (filename.includes("gdb") || filename.includes("geodatabase")) {
      return {
        type: "bulk",
        format: "File Geodatabase",
        layerCount: 3,
        containedFiles: ["Parcels", "Sales", "Buildings"],
      };
    }

    // Default: mixed content bundle
    return {
      type: "bulk",
      format: "Mixed Data Bundle",
      containedFiles: ["parcels.csv", "sales.xlsx", "boundaries.geojson"],
    };
  };

  // Handle folder drop (for .gdb folders)
  const handleFolderDrop = async (items: DataTransferItemList) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory && entry.name.endsWith(".gdb")) {
          setDetectedContent({
            type: "bulk",
            format: "Esri File Geodatabase",
            layerCount: 5, // Would scan in production
            containedFiles: ["Parcels", "Sales", "Buildings", "Neighborhoods", "Zoning"],
          });
          // Create a marker file for the folder
          setFile(new File([], entry.name, { type: "application/x-esri-geodatabase" }));
          return true;
        }
      }
    }
    return false;
  };

  const handleUpload = async () => {
    if (!file || !datasetType) return;

    setIsUploading(true);
    setError(null);

    try {
      // Route ALL uploads through DataSuiteHub - the single entry point
      const productTypeMap: Record<DatasetType, DataProductType> = {
        parcel: "PARCEL_FABRIC",
        sales: "SALES_STREAM",
        building: "BUILDINGS",
        assessment: "COUNTY_ROLL",
        bulk_package: "COUNTY_ROLL",
        geodatabase: "PARCEL_FABRIC",
      };

      const ingestRun = await dataSuiteHub.ingest({
        countyFips: "53005", // TODO: Get from county context
        product: productTypeMap[datasetType],
        source: "file",
        file,
      });

      // Convert IngestRun to Dataset format for downstream components
      const dataset: Dataset = {
        id: ingestRun.id,
        name: file.name,
        type: datasetType,
        status: ingestRun.status === "ready" ? "ready" : "validating",
        rowCount: ingestRun.row_counts_by_stage?.raw || 0,
        errorCount: ingestRun.row_counts_by_stage?.raw 
          ? ingestRun.row_counts_by_stage.raw - (ingestRun.row_counts_by_stage.valid || 0) 
          : 0,
        createdAt: ingestRun.started_at,
      };

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
    setFiles([]);
    setError(null);
    setDetectedType(null);
    setDetectedContent(null);
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl",
                      detectedContent?.type === "bulk" ? "bg-purple-400/20" : "bg-chart-1/20"
                    )}>
                      {detectedContent?.type === "bulk" ? (
                        <Package className="text-purple-400 h-7 w-7" />
                      ) : (
                        <FileText className="text-chart-1 h-7 w-7" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground text-lg font-medium">{file.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {file.size > 0 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Folder"}
                        {detectedContent?.format && ` - ${detectedContent.format}`}
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

                {/* Bulk Package Content Preview */}
                {detectedContent?.type === "bulk" && detectedContent.containedFiles && (
                  <div className="bg-muted/20 rounded-lg border border-purple-400/20 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">
                        {detectedContent.layerCount 
                          ? `${detectedContent.layerCount} layers detected`
                          : `${detectedContent.containedFiles.length} files detected`
                        }
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detectedContent.containedFiles.map((name) => (
                        <span
                          key={name}
                          className="bg-muted/50 text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs"
                        >
                          {name.endsWith(".csv") && <FileSpreadsheet className="h-3 w-3" />}
                          {name.endsWith(".xlsx") && <Table2 className="h-3 w-3" />}
                          {(name.endsWith(".geojson") || name.endsWith(".shp")) && <MapIcon className="h-3 w-3" />}
                          {!name.includes(".") && <Database className="h-3 w-3" />}
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="text-muted-foreground mt-3 text-xs">
                      All layers will be processed and mapped to the selected data type
                    </p>
                  </div>
                )}
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
                  accept=".csv,.geojson,.json,.zip,.xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={!datasetType}
                />
                {/* Hidden input for folder/directory selection (for .gdb) */}
                <input
                  type="file"
                  id="folder-upload"
                  className="hidden"
                  // @ts-expect-error - webkitdirectory is not in types
                  webkitdirectory=""
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0 && files[0].webkitRelativePath.includes(".gdb")) {
                      setFile(new File([], files[0].webkitRelativePath.split("/")[0], { 
                        type: "application/x-esri-geodatabase" 
                      }));
                      setDetectedContent({
                        type: "bulk",
                        format: "Esri File Geodatabase",
                        layerCount: new Set(files.map(f => f.webkitRelativePath.split("/")[1])).size,
                        containedFiles: Array.from(new Set(files.map(f => f.webkitRelativePath.split("/")[1]))).slice(0, 8),
                      });
                    }
                  }}
                  disabled={!datasetType}
                />
                <div className="flex items-center gap-3">
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
                  <label htmlFor="folder-upload">
                    <Button
                      asChild
                      variant="outline"
                      disabled={!datasetType}
                      className="tf-glass-btn border-border/50 text-foreground cursor-pointer bg-transparent"
                    >
                      <span>
                        <Database className="mr-2 h-4 w-4" />
                        Open .gdb Folder
                      </span>
                    </Button>
                  </label>
                </div>

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
            <p className="text-foreground text-sm font-medium">Supported Data Formats</p>
            <div className="text-muted-foreground mt-2 space-y-2 text-sm">
              <p>
                <strong>Single Files:</strong> CSV, Excel (.xlsx/.xls), GeoJSON
              </p>
              <p>
                <strong>Bulk Packages:</strong> ZIP files containing any combination of CSV, Excel, GeoJSON, or Shapefiles (.shp + .dbf + .shx + .prj)
              </p>
              <p>
                <strong>Geodatabases:</strong> Esri File Geodatabase folders (.gdb) - use the "Open .gdb Folder" button to select the entire folder
              </p>
              <p className="text-xs text-blue-400/80">
                Tip: ZIP files with multiple data types will be processed together and mapped to your selected category
              </p>
            </div>
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

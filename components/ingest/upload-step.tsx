"use client";

import React from "react";

import { useState, useCallback } from "react";
import { Upload, FileText, MapIcon, Archive, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadDataset, type Dataset, type DatasetType } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadStepProps {
  onComplete: (dataset: Dataset) => void;
}

const acceptedTypes = [
  { ext: ".csv", icon: FileText, label: "CSV Files" },
  { ext: ".geojson", icon: MapIcon, label: "GeoJSON" },
  { ext: ".zip", icon: Archive, label: "Zipped Shapefiles" },
];

const datasetTypes: { value: DatasetType; label: string }[] = [
  { value: "parcel", label: "Parcel Master File" },
  { value: "sales", label: "Sales Records" },
  { value: "building", label: "Building Data" },
  { value: "assessment", label: "Assessment Roll" },
];

export function UploadStep({ onComplete }: UploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [datasetType, setDatasetType] = useState<DatasetType>("parcel");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    console.log("[v0] validateAndSetFile:", f.name, "size:", f.size);
    const validExtensions = [".csv", ".geojson", ".json", ".zip"];
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    console.log("[v0] File extension:", ext);
    if (!validExtensions.includes(ext)) {
      console.log("[v0] Invalid extension");
      setError("Invalid file type. Please upload CSV, GeoJSON, or ZIP files.");
      return;
    }
    setError(null);
    setFile(f);
    console.log("[v0] File set successfully");
  };

  const handleUpload = async () => {
    if (!file) {
      console.log("[v0] handleUpload: No file selected");
      return;
    }

    console.log("[v0] handleUpload: Starting upload for", file.name, "type:", datasetType);
    setIsUploading(true);
    setError(null);

    try {
      const dataset = await uploadDataset(file, datasetType);
      console.log("[v0] handleUpload: Upload success, dataset:", dataset);
      onComplete(dataset);
    } catch (err) {
      console.error("[v0] Upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Dataset Type Selection */}
      <div className="tf-glass rounded-xl p-6">
        <Label className="text-foreground mb-3 block">Dataset Type</Label>
        <Select value={datasetType} onValueChange={(v) => setDatasetType(v as DatasetType)}>
          <SelectTrigger className="bg-input border-border/50 text-foreground w-full max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50">
            {datasetTypes.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-foreground">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          "tf-glass rounded-xl border-2 border-dashed p-8 transition-all",
          isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-border",
          file && "border-primary/30 border-solid"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-lg">
                <FileText className="text-primary h-6 w-6" />
              </div>
              <div>
                <p className="text-foreground font-medium">{file.name}</p>
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
            <p className="text-foreground mb-2 text-lg font-medium">Drop your file here</p>
            <p className="text-muted-foreground mb-6">or click to browse from your computer</p>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.geojson,.json,.zip"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button
                asChild
                variant="outline"
                className="tf-glass-btn border-border/50 text-foreground cursor-pointer bg-transparent"
              >
                <span>Browse Files</span>
              </Button>
            </label>

            {/* Accepted Types */}
            <div className="mt-8 flex items-center justify-center gap-6">
              {acceptedTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.ext}
                    className="text-muted-foreground flex items-center gap-2 text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-3 rounded-lg border p-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="tf-glass-btn tf-glass-btn--primary text-foreground px-8 font-medium"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

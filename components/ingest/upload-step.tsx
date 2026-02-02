"use client";

import React from "react"

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  MapIcon,
  Archive,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
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

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        validateAndSetFile(selectedFile);
      }
    },
    []
  );

  const validateAndSetFile = (f: File) => {
    const validExtensions = [".csv", ".geojson", ".json", ".zip"];
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (!validExtensions.includes(ext)) {
      setError("Invalid file type. Please upload CSV, GeoJSON, or ZIP files.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const dataset = await uploadDataset(file, datasetType);
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
      <div className="glass-panel rounded-xl p-6">
        <Label className="text-foreground mb-3 block">Dataset Type</Label>
        <Select
          value={datasetType}
          onValueChange={(v) => setDatasetType(v as DatasetType)}
        >
          <SelectTrigger className="w-full max-w-md bg-input border-border/50 text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50">
            {datasetTypes.map((type) => (
              <SelectItem
                key={type.value}
                value={type.value}
                className="text-foreground"
              >
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          "glass-panel rounded-xl p-8 border-2 border-dashed transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-border",
          file && "border-solid border-primary/30"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
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
              <X className="w-5 h-5" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/30 flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              Drop your file here
            </p>
            <p className="text-muted-foreground mb-6">
              or click to browse from your computer
            </p>

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
                className="glass-btn border-border/50 text-foreground cursor-pointer bg-transparent"
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
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Icon className="w-4 h-4" />
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
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="glass-btn-primary text-foreground font-medium px-8"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

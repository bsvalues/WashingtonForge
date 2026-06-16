"use client";

import {
  FileText,
  Calendar,
  Hash,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Database,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dataset } from "@/lib/api";

interface IngestSummaryCardProps {
  dataset: Dataset;
  mappedFieldsCount?: number;
  validatedRowsCount?: number;
  className?: string;
}

export function IngestSummaryCard({
  dataset,
  mappedFieldsCount,
  validatedRowsCount,
  className,
}: IngestSummaryCardProps) {
  const statusConfig = {
    uploading: { label: "Uploading", color: "text-blue-400", bgColor: "bg-blue-400/20" },
    validating: { label: "Validating", color: "text-amber-400", bgColor: "bg-amber-400/20" },
    mapping: { label: "Mapping", color: "text-purple-400", bgColor: "bg-purple-400/20" },
    ready: { label: "Ready", color: "text-chart-1", bgColor: "bg-chart-1/20" },
    published: { label: "Published", color: "text-chart-1", bgColor: "bg-chart-1/20" },
    failed: { label: "Failed", color: "text-destructive", bgColor: "bg-destructive/20" },
  };

  const status = statusConfig[dataset.status] || statusConfig.validating;

  const typeLabels: Record<string, string> = {
    parcel: "Parcel Master",
    sales: "Sales Records",
    building: "Building Data",
    assessment: "Assessment Roll",
  };

  return (
    <div className={cn("tf-glass rounded-xl p-6", className)}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-xl">
            <FileText className="text-primary h-6 w-6" />
          </div>
          <div>
            <h3 className="text-foreground font-semibold">{dataset.name}</h3>
            <p className="text-muted-foreground text-sm">{typeLabels[dataset.type] || dataset.type}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", status.bgColor, status.color)}>
          {dataset.status === "published" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : dataset.status === "failed" ? (
            <XCircle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {status.label}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/20 p-3 text-center">
          <Hash className="text-muted-foreground mx-auto mb-1 h-4 w-4" />
          <p className="text-foreground text-lg font-semibold">
            {dataset.rowCount?.toLocaleString() || "—"}
          </p>
          <p className="text-muted-foreground text-xs">Total Rows</p>
        </div>

        {mappedFieldsCount !== undefined && (
          <div className="rounded-lg bg-muted/20 p-3 text-center">
            <Database className="text-muted-foreground mx-auto mb-1 h-4 w-4" />
            <p className="text-foreground text-lg font-semibold">{mappedFieldsCount}</p>
            <p className="text-muted-foreground text-xs">Mapped Fields</p>
          </div>
        )}

        {validatedRowsCount !== undefined && (
          <div className="rounded-lg bg-muted/20 p-3 text-center">
            <CheckCircle2 className="text-chart-1 mx-auto mb-1 h-4 w-4" />
            <p className="text-chart-1 text-lg font-semibold">
              {validatedRowsCount.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs">Valid Rows</p>
          </div>
        )}

        {dataset.errorCount !== undefined && dataset.errorCount > 0 && (
          <div className="rounded-lg bg-muted/20 p-3 text-center">
            <XCircle className="text-destructive mx-auto mb-1 h-4 w-4" />
            <p className="text-destructive text-lg font-semibold">{dataset.errorCount}</p>
            <p className="text-muted-foreground text-xs">Errors</p>
          </div>
        )}

        <div className="rounded-lg bg-muted/20 p-3 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-1 h-4 w-4" />
          <p className="text-foreground text-sm font-medium">
            {new Date(dataset.createdAt).toLocaleDateString()}
          </p>
          <p className="text-muted-foreground text-xs">Uploaded</p>
        </div>
      </div>

      {/* Data Flow Mini */}
      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/10 p-3">
        <span className="text-muted-foreground text-xs">Upload</span>
        <ArrowRight className="text-muted-foreground/50 h-3 w-3" />
        <span className="text-muted-foreground text-xs">Map</span>
        <ArrowRight className="text-muted-foreground/50 h-3 w-3" />
        <span className="text-muted-foreground text-xs">Validate</span>
        <ArrowRight className="text-muted-foreground/50 h-3 w-3" />
        <span className="text-muted-foreground text-xs">Preview</span>
        <ArrowRight className="text-muted-foreground/50 h-3 w-3" />
        <span className={cn(
          "text-xs font-medium",
          dataset.status === "published" ? "text-chart-1" : "text-muted-foreground"
        )}>
          Publish
        </span>
      </div>
    </div>
  );
}

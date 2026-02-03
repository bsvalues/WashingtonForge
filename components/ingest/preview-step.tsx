"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Loader2, Eye, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { previewDataset, type Dataset, type FieldMapping } from "@/lib/api";

interface PreviewStepProps {
  dataset: Dataset;
  fieldMappings: FieldMapping[];
  onComplete: () => void;
  onBack: () => void;
}

export function PreviewStep({ dataset, fieldMappings, onComplete, onBack }: PreviewStepProps) {
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreview() {
      try {
        const data = await previewDataset(dataset.id, 10);
        setPreviewData(data);
      } catch (err) {
        console.error("[v0] Failed to load preview:", err);
        setError("Failed to load data preview.");
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
  }, [dataset.id]);

  // Get mapped column names
  const mappedColumns = fieldMappings.map((m) => m.targetField);

  if (isLoading) {
    return (
      <div className="tf-glass rounded-xl p-12 text-center">
        <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
        <h3 className="text-foreground mb-2 text-lg font-medium">Loading Preview</h3>
        <p className="text-muted-foreground">Preparing data preview with mapped fields...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tf-glass rounded-xl p-12 text-center">
        <Eye className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <h3 className="text-foreground mb-2 text-lg font-medium">Preview Unavailable</h3>
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

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="tf-glass flex items-start gap-4 rounded-xl p-4">
        <TableIcon className="text-primary mt-0.5 h-6 w-6 shrink-0" />
        <div>
          <p className="text-foreground font-medium">Data Preview</p>
          <p className="text-muted-foreground text-sm">
            Review the first 10 rows of your mapped data before publishing. Verify that values are
            correctly aligned with their target fields.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="tf-glass rounded-xl p-4 text-center">
          <p className="text-foreground text-2xl font-semibold">
            {dataset.rowCount?.toLocaleString() || "—"}
          </p>
          <p className="text-muted-foreground text-sm">Total Rows</p>
        </div>
        <div className="tf-glass rounded-xl p-4 text-center">
          <p className="text-foreground text-2xl font-semibold">{mappedColumns.length}</p>
          <p className="text-muted-foreground text-sm">Mapped Fields</p>
        </div>
        <div className="tf-glass rounded-xl p-4 text-center">
          <p className="text-foreground text-2xl font-semibold">{dataset.errorCount || 0}</p>
          <p className="text-muted-foreground text-sm">Errors</p>
        </div>
        <div className="tf-glass rounded-xl p-4 text-center">
          <p className="text-primary text-2xl font-semibold capitalize">{dataset.type}</p>
          <p className="text-muted-foreground text-sm">Dataset Type</p>
        </div>
      </div>

      {/* Preview Table */}
      <div className="tf-glass overflow-hidden rounded-xl">
        <div className="border-border/50 border-b p-4">
          <h3 className="text-foreground font-medium">Sample Data (First 10 Rows)</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                {mappedColumns.map((col) => (
                  <TableHead key={col} className="text-muted-foreground whitespace-nowrap">
                    {col.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={mappedColumns.length}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No preview data available
                  </TableCell>
                </TableRow>
              ) : (
                previewData.map((row, idx) => (
                  <TableRow key={idx} className="border-border/50">
                    {mappedColumns.map((col) => (
                      <TableCell
                        key={col}
                        className="text-foreground max-w-[200px] truncate whitespace-nowrap"
                      >
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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
        <GlassButton
          onClick={onComplete}
          tone="primary"
          className="text-foreground font-medium"
        >
          Continue to Publish
          <ArrowRight className="ml-2 h-4 w-4" />
        </GlassButton>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Eye,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function PreviewStep({
  dataset,
  fieldMappings,
  onComplete,
  onBack,
}: PreviewStepProps) {
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
      <div className="glass-panel rounded-xl p-12 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Loading Preview
        </h3>
        <p className="text-muted-foreground">
          Preparing data preview with mapped fields...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center">
        <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Preview Unavailable
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

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="glass-panel rounded-xl p-4 flex items-start gap-4">
        <TableIcon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Data Preview</p>
          <p className="text-sm text-muted-foreground">
            Review the first 10 rows of your mapped data before publishing.
            Verify that values are correctly aligned with their target fields.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">
            {dataset.rowCount?.toLocaleString() || "—"}
          </p>
          <p className="text-sm text-muted-foreground">Total Rows</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">
            {mappedColumns.length}
          </p>
          <p className="text-sm text-muted-foreground">Mapped Fields</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-foreground">
            {dataset.errorCount || 0}
          </p>
          <p className="text-sm text-muted-foreground">Errors</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-primary capitalize">
            {dataset.type}
          </p>
          <p className="text-sm text-muted-foreground">Dataset Type</p>
        </div>
      </div>

      {/* Preview Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-medium text-foreground">
            Sample Data (First 10 Rows)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                {mappedColumns.map((col) => (
                  <TableHead
                    key={col}
                    className="text-muted-foreground whitespace-nowrap"
                  >
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
                    className="text-center text-muted-foreground py-8"
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
                        className="text-foreground whitespace-nowrap max-w-[200px] truncate"
                      >
                        {row[col] !== undefined && row[col] !== null
                          ? String(row[col])
                          : "—"}
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
          className="glass-btn border-border/50 text-foreground bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          className="glass-btn-primary text-foreground font-medium"
        >
          Continue to Publish
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

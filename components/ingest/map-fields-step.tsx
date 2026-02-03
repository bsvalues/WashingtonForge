"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Loader2, Link2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSourceFields,
  saveFieldMapping,
  type Dataset,
  type FieldMapping,
  type TargetField,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface MapFieldsStepProps {
  dataset: Dataset;
  onComplete: (mappings: FieldMapping[]) => void;
  onBack: () => void;
}

const requiredFields: { field: TargetField; label: string; required: boolean }[] = [
  { field: "parcel_id", label: "Parcel ID", required: true },
  { field: "situs", label: "Situs Address", required: true },
  { field: "land_value", label: "Land Value", required: true },
  { field: "imp_value", label: "Improvement Value", required: true },
  { field: "sale_price", label: "Sale Price", required: false },
  { field: "sale_date", label: "Sale Date", required: false },
  { field: "geometry", label: "Geometry", required: false },
  { field: "property_class", label: "Property Class", required: false },
  { field: "neighborhood", label: "Neighborhood", required: false },
  { field: "year_built", label: "Year Built", required: false },
  { field: "square_feet", label: "Square Feet", required: false },
];

export function MapFieldsStep({ dataset, onComplete, onBack }: MapFieldsStepProps) {
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<TargetField, string>>(
    {} as Record<TargetField, string>
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFields() {
      try {
        const fields = await getSourceFields(dataset.id);
        setSourceFields(fields);

        // Auto-map fields with similar names
        const autoMapped: Record<string, string> = {};
        for (const target of requiredFields) {
          const match = fields.find(
            (f) =>
              f.toLowerCase().replace(/[_\s-]/g, "") ===
              target.field.toLowerCase().replace(/[_\s-]/g, "")
          );
          if (match) {
            autoMapped[target.field] = match;
          }
        }
        setMappings(autoMapped as Record<TargetField, string>);
      } catch (err) {
        console.error("[v0] Failed to load source fields:", err);
        setError("Failed to load source fields.");
      } finally {
        setIsLoading(false);
      }
    }
    loadFields();
  }, [dataset.id]);

  const updateMapping = (targetField: TargetField, sourceField: string) => {
    setMappings((prev) => ({
      ...prev,
      [targetField]: sourceField === "none" ? "" : sourceField,
    }));
  };

  const handleSave = async () => {
    // Check required fields
    const missingRequired = requiredFields.filter((f) => f.required && !mappings[f.field]);

    if (missingRequired.length > 0) {
      setError(`Please map required fields: ${missingRequired.map((f) => f.label).join(", ")}`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const fieldMappings: FieldMapping[] = Object.entries(mappings)
        .filter(([, source]) => source)
        .map(([target, source]) => ({
          targetField: target as TargetField,
          sourceField: source,
        }));

      await saveFieldMapping(dataset.id, fieldMappings);
      onComplete(fieldMappings);
    } catch (err) {
      console.error("[v0] Failed to save mappings:", err);
      setError("Failed to save field mappings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="tf-glass rounded-xl p-12 text-center">
        <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
        <h3 className="text-foreground mb-2 text-lg font-medium">Loading Source Fields</h3>
        <p className="text-muted-foreground">Analyzing your dataset structure...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="tf-glass flex items-start gap-4 rounded-xl p-4">
        <Link2 className="text-primary mt-0.5 h-6 w-6 shrink-0" />
        <div>
          <p className="text-foreground font-medium">Map Your Fields</p>
          <p className="text-muted-foreground text-sm">
            Connect your source columns to the required TerraFusion schema fields. Required fields
            are marked with an asterisk (*).
          </p>
        </div>
      </div>

      {/* Field Mapping Grid */}
      <div className="tf-glass overflow-hidden rounded-xl">
        <div className="border-border/50 border-b p-4">
          <h3 className="text-foreground font-medium">Field Mappings</h3>
        </div>
        <div className="divide-border/50 divide-y">
          {requiredFields.map((field) => (
            <div
              key={field.field}
              className="hover:bg-muted/10 flex items-center gap-4 p-4 transition-colors"
            >
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium",
                    field.required ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </p>
                <p className="text-muted-foreground font-mono text-xs">{field.field}</p>
              </div>

              <div className="flex w-8 items-center justify-center">
                <div className="bg-border/50 h-0.5 w-8" />
              </div>

              <div className="flex-1">
                <Select
                  value={mappings[field.field] || "none"}
                  onValueChange={(v) => updateMapping(field.field, v)}
                >
                  <SelectTrigger
                    className={cn(
                      "bg-input border-border/50 text-foreground w-full",
                      mappings[field.field] && "border-primary/30 bg-primary/5"
                    )}
                  >
                    <SelectValue placeholder="Select source field" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50 max-h-60">
                    <SelectItem value="none" className="text-muted-foreground">
                      -- Not mapped --
                    </SelectItem>
                    {sourceFields.map((source) => (
                      <SelectItem key={source} value={source} className="text-foreground">
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-3 rounded-lg border p-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
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
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="tf-glass-btn tf-glass-btn--primary text-foreground font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Preview
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

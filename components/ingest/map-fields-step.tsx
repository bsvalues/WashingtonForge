"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Link2,
  AlertCircle,
} from "lucide-react";
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

export function MapFieldsStep({
  dataset,
  onComplete,
  onBack,
}: MapFieldsStepProps) {
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<TargetField, string>>({} as Record<TargetField, string>);
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
    const missingRequired = requiredFields.filter(
      (f) => f.required && !mappings[f.field]
    );

    if (missingRequired.length > 0) {
      setError(
        `Please map required fields: ${missingRequired.map((f) => f.label).join(", ")}`
      );
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
      <div className="glass-panel rounded-xl p-12 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Loading Source Fields
        </h3>
        <p className="text-muted-foreground">
          Analyzing your dataset structure...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="glass-panel rounded-xl p-4 flex items-start gap-4">
        <Link2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">
            Map Your Fields
          </p>
          <p className="text-sm text-muted-foreground">
            Connect your source columns to the required TerraFusion schema
            fields. Required fields are marked with an asterisk (*).
          </p>
        </div>
      </div>

      {/* Field Mapping Grid */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-medium text-foreground">Field Mappings</h3>
        </div>
        <div className="divide-y divide-border/50">
          {requiredFields.map((field) => (
            <div
              key={field.field}
              className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors"
            >
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium",
                    field.required ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {field.field}
                </p>
              </div>

              <div className="w-8 flex items-center justify-center">
                <div className="w-8 h-0.5 bg-border/50" />
              </div>

              <div className="flex-1">
                <Select
                  value={mappings[field.field] || "none"}
                  onValueChange={(v) => updateMapping(field.field, v)}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full bg-input border-border/50 text-foreground",
                      mappings[field.field] &&
                        "border-primary/30 bg-primary/5"
                    )}
                  >
                    <SelectValue placeholder="Select source field" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50 max-h-60">
                    <SelectItem value="none" className="text-muted-foreground">
                      -- Not mapped --
                    </SelectItem>
                    {sourceFields.map((source) => (
                      <SelectItem
                        key={source}
                        value={source}
                        className="text-foreground"
                      >
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
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
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
          onClick={handleSave}
          disabled={isSaving}
          className="glass-btn-primary text-foreground font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Preview
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

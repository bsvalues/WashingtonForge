"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Link2,
  AlertCircle,
  Sparkles,
  Check,
  X,
  Wand2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getSourceFields,
  saveFieldMapping,
  type Dataset,
  type FieldMapping,
  type TargetField,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface SmartMapFieldsStepProps {
  dataset: Dataset;
  onComplete: (mappings: FieldMapping[]) => void;
  onBack: () => void;
}

interface FieldDefinition {
  field: TargetField;
  label: string;
  required: boolean;
  description: string;
  commonAliases: string[];
  category: "identity" | "value" | "sales" | "property" | "geometry";
}

const fieldDefinitions: FieldDefinition[] = [
  // Identity
  {
    field: "parcel_id",
    label: "Parcel ID",
    required: true,
    description: "Unique parcel identifier (APN, PIN, PARID)",
    commonAliases: ["parid", "apn", "pin", "parcel_number", "parcel_no", "parcelnumber", "parcelid"],
    category: "identity",
  },
  {
    field: "situs",
    label: "Situs Address",
    required: true,
    description: "Property street address",
    commonAliases: ["situs_addr", "address", "property_address", "street_address", "situsaddress", "prop_addr"],
    category: "identity",
  },
  // Value
  {
    field: "land_value",
    label: "Land Value",
    required: true,
    description: "Assessed land value",
    commonAliases: ["land_val", "landvalue", "land_assessed", "land_av", "lndval"],
    category: "value",
  },
  {
    field: "imp_value",
    label: "Improvement Value",
    required: true,
    description: "Assessed improvement/structure value",
    commonAliases: ["imp_val", "impvalue", "impr_value", "bldg_value", "improvement", "impval", "bldgval"],
    category: "value",
  },
  // Sales
  {
    field: "sale_price",
    label: "Sale Price",
    required: false,
    description: "Transaction sale price",
    commonAliases: ["saleprice", "sale_amt", "sales_price", "price", "sale_amount", "salesprice"],
    category: "sales",
  },
  {
    field: "sale_date",
    label: "Sale Date",
    required: false,
    description: "Date of sale transaction",
    commonAliases: ["saledate", "sale_dt", "salesdate", "trans_date", "deed_date"],
    category: "sales",
  },
  // Property
  {
    field: "property_class",
    label: "Property Class",
    required: false,
    description: "Property use classification code",
    commonAliases: ["propclass", "prop_class", "class_code", "use_code", "land_use", "usecode", "classcd"],
    category: "property",
  },
  {
    field: "neighborhood",
    label: "Neighborhood",
    required: false,
    description: "Geographic neighborhood or area code",
    commonAliases: ["nbhd", "neighborhood_cd", "area_code", "district", "nbhdcode", "neighcode"],
    category: "property",
  },
  {
    field: "year_built",
    label: "Year Built",
    required: false,
    description: "Year primary structure was built",
    commonAliases: ["yearbuilt", "yr_built", "yrbuilt", "built_year", "constr_year"],
    category: "property",
  },
  {
    field: "square_feet",
    label: "Square Feet",
    required: false,
    description: "Building square footage",
    commonAliases: ["sqft", "sq_ft", "squarefeet", "bldg_sqft", "living_area", "gross_area", "sfla"],
    category: "property",
  },
  // Geometry
  {
    field: "geometry",
    label: "Geometry",
    required: false,
    description: "Parcel boundary geometry (WKT or GeoJSON)",
    commonAliases: ["geom", "wkt", "shape", "the_geom", "boundary"],
    category: "geometry",
  },
];

const categoryLabels: Record<string, string> = {
  identity: "Identity Fields",
  value: "Value Fields",
  sales: "Sales Data",
  property: "Property Characteristics",
  geometry: "Spatial Data",
};

export function SmartMapFieldsStep({ dataset, onComplete, onBack }: SmartMapFieldsStepProps) {
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<TargetField, string>>({} as Record<TargetField, string>);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoMappedCount, setAutoMappedCount] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    identity: true,
    value: true,
    sales: true,
    property: false,
    geometry: false,
  });

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, FieldDefinition[]> = {};
    for (const field of fieldDefinitions) {
      if (!grouped[field.category]) grouped[field.category] = [];
      grouped[field.category].push(field);
    }
    return grouped;
  }, []);

  useEffect(() => {
    async function loadFields() {
      try {
        const fields = await getSourceFields(dataset.id);
        setSourceFields(fields);

        // Smart auto-mapping using aliases
        const autoMapped: Record<string, string> = {};
        let mappedCount = 0;

        for (const def of fieldDefinitions) {
          // Normalize source field names for comparison
          const normalizedSourceFields = fields.map((f) => ({
            original: f,
            normalized: f.toLowerCase().replace(/[_\s-]/g, ""),
          }));

          // Check exact match first
          let match = normalizedSourceFields.find(
            (f) => f.normalized === def.field.replace(/_/g, "")
          );

          // Then check aliases
          if (!match) {
            for (const alias of def.commonAliases) {
              match = normalizedSourceFields.find(
                (f) => f.normalized === alias.replace(/[_\s-]/g, "")
              );
              if (match) break;
            }
          }

          if (match) {
            autoMapped[def.field] = match.original;
            mappedCount++;
          }
        }

        setMappings(autoMapped as Record<TargetField, string>);
        setAutoMappedCount(mappedCount);
      } catch (err) {
        console.error("Failed to load source fields:", err);
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

  const clearAllMappings = () => {
    setMappings({} as Record<TargetField, string>);
  };

  const handleSave = async () => {
    // Check required fields
    const missingRequired = fieldDefinitions.filter((f) => f.required && !mappings[f.field]);

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
      console.error("Failed to save mappings:", err);
      setError("Failed to save field mappings.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Stats
  const requiredMapped = fieldDefinitions.filter((f) => f.required && mappings[f.field]).length;
  const requiredTotal = fieldDefinitions.filter((f) => f.required).length;
  const optionalMapped = fieldDefinitions.filter((f) => !f.required && mappings[f.field]).length;
  const optionalTotal = fieldDefinitions.filter((f) => !f.required).length;

  if (isLoading) {
    return (
      <div className="tf-glass rounded-xl p-12 text-center">
        <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
        <h3 className="text-foreground mb-2 text-lg font-medium">Analyzing Your Data</h3>
        <p className="text-muted-foreground">Detecting column structure and auto-mapping fields...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-mapping success banner */}
      {autoMappedCount > 0 && (
        <div className="tf-glass flex items-center gap-4 rounded-xl border border-chart-1/30 bg-chart-1/5 p-4">
          <div className="bg-chart-1/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <Sparkles className="text-chart-1 h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-foreground font-medium">
              Smart Mapping Complete
            </p>
            <p className="text-muted-foreground text-sm">
              Auto-mapped {autoMappedCount} of {fieldDefinitions.length} fields based on column names.
              Review and adjust as needed.
            </p>
          </div>
        </div>
      )}

      {/* Mapping Progress */}
      <div className="tf-glass rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="text-primary h-5 w-5" />
            <h3 className="text-foreground font-semibold">Field Mapping Progress</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllMappings}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset All
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-chart-1/10 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Required Fields</span>
              <span className="text-chart-1 text-sm font-medium">
                {requiredMapped}/{requiredTotal}
              </span>
            </div>
            <div className="bg-muted/30 h-2 overflow-hidden rounded-full">
              <div
                className="bg-chart-1 h-full rounded-full transition-all"
                style={{ width: `${(requiredMapped / requiredTotal) * 100}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Optional Fields</span>
              <span className="text-primary text-sm font-medium">
                {optionalMapped}/{optionalTotal}
              </span>
            </div>
            <div className="bg-muted/30 h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${(optionalMapped / optionalTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Field Mapping by Category */}
      <div className="space-y-4">
        {Object.entries(fieldsByCategory).map(([category, fields]) => (
          <Collapsible
            key={category}
            open={expandedCategories[category]}
            onOpenChange={() => toggleCategory(category)}
          >
            <div className="tf-glass overflow-hidden rounded-xl">
              <CollapsibleTrigger className="hover:bg-muted/10 flex w-full items-center justify-between p-4 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-medium">{categoryLabels[category]}</span>
                  <span className="text-muted-foreground text-sm">
                    ({fields.filter((f) => mappings[f.field]).length}/{fields.length} mapped)
                  </span>
                </div>
                {expandedCategories[category] ? (
                  <ChevronUp className="text-muted-foreground h-5 w-5" />
                ) : (
                  <ChevronDown className="text-muted-foreground h-5 w-5" />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="divide-border/50 divide-y">
                  {fields.map((field) => (
                    <div
                      key={field.field}
                      className="hover:bg-muted/10 flex items-center gap-4 p-4 transition-colors"
                    >
                      {/* Target Field Info */}
                      <div className="min-w-[180px] flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn("font-medium", field.required ? "text-foreground" : "text-muted-foreground")}>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </p>
                          {mappings[field.field] && (
                            <Check className="text-chart-1 h-4 w-4" />
                          )}
                        </div>
                        <p className="text-muted-foreground/70 text-xs">{field.description}</p>
                      </div>

                      {/* Arrow */}
                      <div className="flex w-8 items-center justify-center">
                        <div
                          className={cn(
                            "h-0.5 w-8 transition-colors",
                            mappings[field.field] ? "bg-chart-1/50" : "bg-border/50"
                          )}
                        />
                      </div>

                      {/* Source Field Selector */}
                      <div className="min-w-[200px] flex-1">
                        <Select
                          value={mappings[field.field] || "none"}
                          onValueChange={(v) => updateMapping(field.field, v)}
                        >
                          <SelectTrigger
                            className={cn(
                              "bg-input border-border/50 text-foreground w-full",
                              mappings[field.field] && "border-chart-1/30 bg-chart-1/5"
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
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-3 rounded-xl border p-4">
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
          disabled={isSaving || requiredMapped < requiredTotal}
          className="tf-glass-btn tf-glass-btn--primary text-foreground font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Validation
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

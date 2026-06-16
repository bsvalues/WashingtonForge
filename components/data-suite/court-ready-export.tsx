"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Shield,
  CheckCircle2,
  Clock,
  Hash,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  Scale,
  FileCheck,
  Stamp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface LineageEvent {
  id: string;
  timestamp: string;
  event_type: string;
  description: string;
  actor: string;
  evidence_hash?: string;
}

interface ExportSection {
  id: string;
  label: string;
  description: string;
  required: boolean;
  icon: React.ReactNode;
}

interface CourtReadyExportProps {
  parcelId: string;
  parcelAddress?: string;
  countyName: string;
  rollYear: number;
  assessedValue: number;
  marketValue: number;
  lineageEvents: LineageEvent[];
  onExport: (sections: string[], format: "pdf" | "docx") => Promise<void>;
}

// =============================================================================
// Export Sections Configuration
// =============================================================================

const EXPORT_SECTIONS: ExportSection[] = [
  {
    id: "property_summary",
    label: "Property Summary",
    description: "Basic property information, legal description, and current values",
    required: true,
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "valuation_history",
    label: "Valuation History",
    description: "5-year assessment history with change explanations",
    required: true,
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: "comparable_sales",
    label: "Comparable Sales Analysis",
    description: "Selected comps with adjustments and similarity scores",
    required: false,
    icon: <Scale className="h-4 w-4" />,
  },
  {
    id: "model_coefficients",
    label: "Model Coefficients",
    description: "Calibration results applied to this property",
    required: false,
    icon: <Hash className="h-4 w-4" />,
  },
  {
    id: "data_lineage",
    label: "Data Lineage & Provenance",
    description: "Complete audit trail with evidence hashes",
    required: true,
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: "methodology_statement",
    label: "Methodology Statement",
    description: "IAAO-compliant mass appraisal methodology documentation",
    required: false,
    icon: <FileCheck className="h-4 w-4" />,
  },
  {
    id: "certification",
    label: "Certification Page",
    description: "Assessor certification with digital signature",
    required: true,
    icon: <Stamp className="h-4 w-4" />,
  },
];

// =============================================================================
// Component
// =============================================================================

export function CourtReadyExport({
  parcelId,
  parcelAddress,
  countyName,
  rollYear,
  assessedValue,
  marketValue,
  lineageEvents,
  onExport,
}: CourtReadyExportProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    EXPORT_SECTIONS.filter((s) => s.required).map((s) => s.id)
  );
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const toggleSection = (sectionId: string) => {
    const section = EXPORT_SECTIONS.find((s) => s.id === sectionId);
    if (section?.required) return; // Can't toggle required sections

    setSelectedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);
    try {
      await onExport(selectedSections, exportFormat);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate export timestamp for display
  const exportTimestamp = new Date().toISOString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-foreground text-xl font-semibold">Court-Ready Export</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate a comprehensive valuation defense package with full data provenance
          </p>
        </div>
        <div className="bg-primary/10 border-primary/30 flex items-center gap-2 rounded-lg border px-3 py-1.5">
          <Shield className="text-primary h-4 w-4" />
          <span className="text-primary text-xs font-medium">Court-Admissible</span>
        </div>
      </div>

      {/* Property Summary Card */}
      <Card className="tf-glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">Subject Property</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">Parcel ID</p>
              <p className="text-foreground font-mono text-sm">{parcelId}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Address</p>
              <p className="text-foreground text-sm">{parcelAddress || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Assessed Value ({rollYear})</p>
              <p className="text-foreground text-sm font-medium">
                ${assessedValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Market Value ({rollYear})</p>
              <p className="text-foreground text-sm font-medium">
                ${marketValue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Selection */}
      <Card className="tf-glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">Export Sections</CardTitle>
          <CardDescription>Select which sections to include in the export package</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {EXPORT_SECTIONS.map((section) => {
              const isSelected = selectedSections.includes(section.id);
              return (
                <div
                  key={section.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/30 hover:border-border/50",
                    section.required && "cursor-not-allowed opacity-90"
                  )}
                  onClick={() => toggleSection(section.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={section.required}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{section.icon}</span>
                      <Label className="text-foreground cursor-pointer text-sm font-medium">
                        {section.label}
                      </Label>
                      {section.required && (
                        <span className="bg-primary/20 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">{section.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Lineage Preview */}
      <Card className="tf-glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2 text-base">
            <Shield className="text-primary h-4 w-4" />
            Data Lineage Trail
          </CardTitle>
          <CardDescription>
            {lineageEvents.length} provenance events will be included
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {lineageEvents.slice(0, 5).map((event, index) => (
              <div
                key={event.id}
                className="border-border/30 flex items-start gap-3 border-b pb-2 last:border-0"
              >
                <div className="bg-primary/20 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <span className="text-primary text-xs font-medium">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">{event.event_type}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{event.description}</p>
                  {event.evidence_hash && (
                    <p className="text-muted-foreground mt-1 font-mono text-[10px]">
                      Hash: {event.evidence_hash.slice(0, 16)}...
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <User className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-xs">{event.actor}</span>
                </div>
              </div>
            ))}
            {lineageEvents.length > 5 && (
              <p className="text-muted-foreground pt-2 text-center text-xs">
                + {lineageEvents.length - 5} more events
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Controls */}
      <Card className="tf-glass border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Format Selection */}
            <div className="flex items-center gap-4">
              <span className="text-foreground text-sm">Export Format:</span>
              <div className="flex gap-2">
                <Button
                  variant={exportFormat === "pdf" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat("pdf")}
                  className={cn(
                    exportFormat === "pdf"
                      ? "tf-glass-btn--primary"
                      : "tf-glass-btn border-border/50"
                  )}
                >
                  PDF
                </Button>
                <Button
                  variant={exportFormat === "docx" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportFormat("docx")}
                  className={cn(
                    exportFormat === "docx"
                      ? "tf-glass-btn--primary"
                      : "tf-glass-btn border-border/50"
                  )}
                >
                  DOCX
                </Button>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedSections.length === 0}
              className="tf-glass-btn tf-glass-btn--primary text-foreground min-w-[180px]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : exportComplete ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Package
                </>
              )}
            </Button>
          </div>

          {/* Export Metadata */}
          <div className="border-border/30 mt-4 flex flex-wrap gap-4 border-t pt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground">Generated:</span>
              <span className="text-foreground font-mono">
                {new Date().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground">By:</span>
              <span className="text-foreground">{countyName} Assessor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Hash className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground">Sections:</span>
              <span className="text-foreground">{selectedSections.length} selected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <p className="text-foreground text-sm font-medium">Legal Notice</p>
          <p className="text-muted-foreground mt-1 text-xs">
            This export package contains certified assessment data and methodology documentation
            suitable for Board of Equalization proceedings. All data lineage events are
            cryptographically verified and court-admissible under Washington State RCW 84.40.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Quick Export Button (for use in other components)
// =============================================================================

interface QuickExportButtonProps {
  parcelId: string;
  className?: string;
  onExport: () => void;
}

export function QuickExportButton({ parcelId, className, onExport }: QuickExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onExport}
      className={cn("tf-glass-btn border-border/50", className)}
    >
      <Download className="mr-2 h-4 w-4" />
      Court Export
    </Button>
  );
}

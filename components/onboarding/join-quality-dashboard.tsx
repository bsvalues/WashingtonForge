"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Sparkles,
  Link2,
  Unlink,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { WACountyFips, JoinConfidence, JoinMethod } from "@/lib/wa-data/types";

// ============================================
// Join Quality Types
// ============================================

interface JoinQualityStats {
  total_roll_records: number;
  total_wa_parcels: number;
  matched_high: number;
  matched_med: number;
  matched_low: number;
  unmatched_roll: number;
  unmatched_wa: number;
  match_rate_pct: number;
}

interface MismatchPattern {
  pattern: string;
  description: string;
  affected_count: number;
  example_raw: string;
  example_norm: string;
  suggested_fix: string;
}

interface JoinQualityDashboardProps {
  countyFips: WACountyFips;
  countyName: string;
  stats?: JoinQualityStats;
  mismatchPatterns?: MismatchPattern[];
  onExportMismatches?: () => void;
}

// ============================================
// Demo Data
// ============================================

const DEMO_STATS: JoinQualityStats = {
  total_roll_records: 84532,
  total_wa_parcels: 85100,
  matched_high: 82150,
  matched_med: 1850,
  matched_low: 320,
  unmatched_roll: 212,
  unmatched_wa: 780,
  match_rate_pct: 99.75,
};

const DEMO_MISMATCH_PATTERNS: MismatchPattern[] = [
  {
    pattern: "Condo Unit Suffix",
    description: "APN contains unit suffixes (-A, -B, -001) not in WA fabric",
    affected_count: 145,
    example_raw: "123456-A",
    example_norm: "123456A",
    suggested_fix: "Strip suffix and match to parent parcel, then link as sub-unit",
  },
  {
    pattern: "Leading Zeros",
    description: "County uses leading zeros, WA fabric does not",
    affected_count: 38,
    example_raw: "00123456",
    example_norm: "123456",
    suggested_fix: "Apply normalizeParcelId() to strip leading zeros",
  },
  {
    pattern: "Dash Formatting",
    description: "County uses dashes in APN, WA fabric uses continuous digits",
    affected_count: 22,
    example_raw: "12-34-56-789",
    example_norm: "123456789",
    suggested_fix: "Remove all non-alphanumeric characters during normalization",
  },
  {
    pattern: "New Subdivisions",
    description: "Recently platted parcels not yet in WA statewide layer",
    affected_count: 7,
    example_raw: "999-2025-001",
    example_norm: "9992025001",
    suggested_fix: "Flag for next WA fabric refresh (Sept 2026)",
  },
];

// ============================================
// Component
// ============================================

export function JoinQualityDashboard({
  countyFips,
  countyName,
  stats = DEMO_STATS,
  mismatchPatterns = DEMO_MISMATCH_PATTERNS,
  onExportMismatches,
}: JoinQualityDashboardProps) {
  const [showMismatchDetails, setShowMismatchDetails] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);

  const matchedTotal = stats.matched_high + stats.matched_med + stats.matched_low;
  const highConfidencePct = (stats.matched_high / matchedTotal) * 100;
  const medConfidencePct = (stats.matched_med / matchedTotal) * 100;
  const lowConfidencePct = (stats.matched_low / matchedTotal) * 100;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-foreground text-xl font-semibold">Join Quality Report</h2>
            <p className="text-muted-foreground text-sm">
              {countyName} County parcel matching results
            </p>
          </div>
          {stats.match_rate_pct >= 99 ? (
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Excellent Match Rate
            </Badge>
          ) : stats.match_rate_pct >= 95 ? (
            <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Good Match Rate
            </Badge>
          ) : (
            <Badge className="border-red-500/20 bg-red-500/10 text-red-500">
              <XCircle className="mr-1 h-3 w-3" />
              Review Required
            </Badge>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Match Rate
                  </p>
                  <p className="text-foreground mt-1 text-2xl font-bold">
                    {stats.match_rate_pct.toFixed(2)}%
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <Link2 className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Matched Records
                  </p>
                  <p className="text-foreground mt-1 text-2xl font-bold">
                    {matchedTotal.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <CheckCircle2 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Unmatched Roll
                  </p>
                  <p className="text-foreground mt-1 text-2xl font-bold">
                    {stats.unmatched_roll.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                  <Unlink className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Unmatched WA
                  </p>
                  <p className="text-foreground mt-1 text-2xl font-bold">
                    {stats.unmatched_wa.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-500/10">
                  <Search className="h-6 w-6 text-slate-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confidence Distribution */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Match Confidence Distribution</CardTitle>
            <CardDescription>How confident we are in each parcel match</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* High Confidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-foreground font-medium">High Confidence (exact match)</span>
                </div>
                <span className="text-muted-foreground">
                  {stats.matched_high.toLocaleString()} ({highConfidencePct.toFixed(1)}%)
                </span>
              </div>
              <Progress value={highConfidencePct} className="bg-muted h-2" />
            </div>

            {/* Medium Confidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-foreground font-medium">
                    Medium Confidence (normalized match)
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Matched after normalizing parcel IDs (removing dashes, stripping leading
                        zeros, etc.)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-muted-foreground">
                  {stats.matched_med.toLocaleString()} ({medConfidencePct.toFixed(1)}%)
                </span>
              </div>
              <Progress value={medConfidencePct} className="bg-muted h-2" />
            </div>

            {/* Low Confidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-foreground font-medium">Low Confidence (fuzzy match)</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Matched using fuzzy algorithms. Review recommended before using in official
                        reports.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-muted-foreground">
                  {stats.matched_low.toLocaleString()} ({lowConfidencePct.toFixed(1)}%)
                </span>
              </div>
              <Progress value={lowConfidencePct} className="bg-muted h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Mismatch Patterns */}
        <Collapsible open={showMismatchDetails} onOpenChange={setShowMismatchDetails}>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    AI-Detected Mismatch Patterns
                  </CardTitle>
                  <CardDescription>Common reasons why records didn&apos;t match</CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {showMismatchDetails ? (
                      <>
                        Hide Details
                        <ChevronUp className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show Details
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Affected</TableHead>
                      <TableHead>Example</TableHead>
                      <TableHead>Suggested Fix</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mismatchPatterns.map((pattern) => (
                      <TableRow
                        key={pattern.pattern}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedPattern === pattern.pattern && "bg-muted/50"
                        )}
                        onClick={() =>
                          setSelectedPattern(
                            selectedPattern === pattern.pattern ? null : pattern.pattern
                          )
                        }
                      >
                        <TableCell>
                          <div>
                            <p className="text-foreground font-medium">{pattern.pattern}</p>
                            <p className="text-muted-foreground text-xs">{pattern.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{pattern.affected_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs">
                            {pattern.example_raw}
                          </code>
                          <span className="text-muted-foreground mx-1">→</span>
                          <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-500">
                            {pattern.example_norm}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs text-sm">
                          {pattern.suggested_fix}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Last analyzed: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportMismatches}
              className="border-border/50"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Mismatches CSV
            </Button>
            <Button size="sm" className="bg-purple-500 text-white hover:bg-purple-600">
              <Sparkles className="mr-2 h-4 w-4" />
              Re-run AI Analysis
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

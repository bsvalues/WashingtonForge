"use client";

import React from "react";

import { useState } from "react";
import {
  FileBarChart,
  Download,
  TrendingUp,
  Activity,
  Scale,
  Target,
  Users,
  AlertTriangle,
  Loader2,
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
import { exportRatioStudyReport, type RatioStudy } from "@/lib/api";
import { cn } from "@/lib/utils";
import { RatioCharts } from "./ratio-charts";

interface StudyResultsProps {
  study: RatioStudy | null;
}

export function StudyResults({ study }: StudyResultsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "pdf" | "csv" | "xlsx") => {
    if (!study) return;

    setIsExporting(true);
    try {
      const blob = await exportRatioStudyReport(study.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${study.name.replace(/\s+/g, "_")}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[v0] Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!study) {
    return (
      <div className="tf-glass flex h-[600px] flex-col items-center justify-center rounded-xl p-12 text-center">
        <div className="bg-muted/30 mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
          <FileBarChart className="text-muted-foreground h-8 w-8" />
        </div>
        <p className="text-foreground mb-1 font-medium">Select a Study</p>
        <p className="text-muted-foreground max-w-xs text-sm">
          Choose a ratio study from the list to view detailed results and statistics
        </p>
      </div>
    );
  }

  if (study.status === "running" || study.status === "pending") {
    return (
      <div className="tf-glass flex h-[600px] flex-col items-center justify-center rounded-xl p-12 text-center">
        <Loader2 className="text-primary mb-4 h-12 w-12 animate-spin" />
        <p className="text-foreground mb-1 font-medium">
          {study.status === "running" ? "Processing..." : "Queued"}
        </p>
        <p className="text-muted-foreground max-w-xs text-sm">
          {study.status === "running"
            ? "Computing ratio study metrics. This may take a few moments."
            : "This study is queued and will start processing shortly."}
        </p>
      </div>
    );
  }

  if (study.status === "failed") {
    return (
      <div className="tf-glass flex h-[600px] flex-col items-center justify-center rounded-xl p-12 text-center">
        <div className="bg-destructive/20 mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
          <AlertTriangle className="text-destructive h-8 w-8" />
        </div>
        <p className="text-foreground mb-1 font-medium">Study Failed</p>
        <p className="text-muted-foreground max-w-xs text-sm">
          This ratio study encountered an error during processing. Please try running a new study.
        </p>
      </div>
    );
  }

  const results = study.results;
  if (!results) return null;

  // Determine status based on IAAO standards
  const getMetricStatus = (metric: string, value: number): "good" | "warning" | "bad" => {
    switch (metric) {
      case "ratio":
        if (value >= 0.95 && value <= 1.05) return "good";
        if (value >= 0.9 && value <= 1.1) return "warning";
        return "bad";
      case "cod":
        if (value <= 15) return "good";
        if (value <= 20) return "warning";
        return "bad";
      case "prd":
        if (value >= 0.98 && value <= 1.03) return "good";
        if (value >= 0.95 && value <= 1.05) return "warning";
        return "bad";
      case "prb":
        if (Math.abs(value) <= 0.05) return "good";
        if (Math.abs(value) <= 0.1) return "warning";
        return "bad";
      default:
        return "good";
    }
  };

  const statusColors = {
    good: "text-chart-1",
    warning: "text-amber-500",
    bad: "text-chart-3",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="tf-glass flex items-center justify-between rounded-xl p-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">{study.name}</h2>
          <p className="text-muted-foreground text-sm">
            Roll Year {study.rollYear} • {results.sampleSize.toLocaleString()} qualified sales
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="tf-glass-btn border-border/50 text-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("xlsx")}
            disabled={isExporting}
            className="tf-glass-btn border-border/50 text-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Median Ratio"
          value={results.medianRatio.toFixed(3)}
          target="0.95 - 1.05"
          icon={TrendingUp}
          status={getMetricStatus("ratio", results.medianRatio)}
        />
        <MetricCard
          label="COD"
          value={`${results.cod.toFixed(1)}%`}
          target="≤ 15%"
          icon={Activity}
          status={getMetricStatus("cod", results.cod)}
        />
        <MetricCard
          label="PRD"
          value={results.prd.toFixed(3)}
          target="0.98 - 1.03"
          icon={Scale}
          status={getMetricStatus("prd", results.prd)}
        />
        <MetricCard
          label="PRB"
          value={results.prb.toFixed(3)}
          target="±0.05"
          icon={Target}
          status={getMetricStatus("prb", results.prb)}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="tf-glass rounded-xl p-4">
          <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">Mean Ratio</p>
          <p className="text-foreground text-xl font-semibold">{results.meanRatio.toFixed(3)}</p>
        </div>
        <div className="tf-glass rounded-xl p-4">
          <div className="mb-1 flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4" />
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Sample Size</p>
          </div>
          <p className="text-foreground text-xl font-semibold">
            {results.sampleSize.toLocaleString()}
          </p>
        </div>
        <div className="tf-glass rounded-xl p-4">
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Outliers Excluded
            </p>
          </div>
          <p className="text-foreground text-xl font-semibold">{results.outlierCount}</p>
        </div>
      </div>

      {/* Visualizations */}
      <RatioCharts study={study} />

      {/* Breakdown Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* By Neighborhood */}
        <div className="tf-glass overflow-hidden rounded-xl">
          <div className="border-border/50 border-b p-4">
            <h3 className="text-foreground font-medium">By Neighborhood</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-muted-foreground">Neighborhood</TableHead>
                  <TableHead className="text-muted-foreground text-right">Median</TableHead>
                  <TableHead className="text-muted-foreground text-right">COD</TableHead>
                  <TableHead className="text-muted-foreground text-right">N</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.byNeighborhood.map((n) => (
                  <TableRow key={n.neighborhood} className="border-border/50">
                    <TableCell className="text-foreground">{n.neighborhood}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        statusColors[getMetricStatus("ratio", n.medianRatio)]
                      )}
                    >
                      {n.medianRatio.toFixed(3)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        statusColors[getMetricStatus("cod", n.cod)]
                      )}
                    >
                      {n.cod.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {n.sampleSize}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* By Property Class */}
        <div className="tf-glass overflow-hidden rounded-xl">
          <div className="border-border/50 border-b p-4">
            <h3 className="text-foreground font-medium">By Property Class</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-muted-foreground">Class</TableHead>
                  <TableHead className="text-muted-foreground text-right">Median</TableHead>
                  <TableHead className="text-muted-foreground text-right">COD</TableHead>
                  <TableHead className="text-muted-foreground text-right">N</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.byPropertyClass.map((c) => (
                  <TableRow key={c.propertyClass} className="border-border/50">
                    <TableCell className="text-foreground">{c.propertyClass}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        statusColors[getMetricStatus("ratio", c.medianRatio)]
                      )}
                    >
                      {c.medianRatio.toFixed(3)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        statusColors[getMetricStatus("cod", c.cod)]
                      )}
                    >
                      {c.cod.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {c.sampleSize}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  target: string;
  icon: React.ElementType;
  status: "good" | "warning" | "bad";
}

function MetricCard({ label, value, target, icon: Icon, status }: MetricCardProps) {
  const statusStyles = {
    good: "text-chart-1 bg-chart-1/20 border-chart-1/30",
    warning: "text-amber-500 bg-amber-500/20 border-amber-500/30",
    bad: "text-chart-3 bg-chart-3/20 border-chart-3/30",
  };

  return (
    <div className="tf-glass rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border",
            statusStyles[status]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-muted-foreground text-xs tracking-wide uppercase">{label}</span>
      </div>
      <p
        className={cn(
          "text-2xl font-semibold",
          status === "good"
            ? "text-chart-1"
            : status === "warning"
              ? "text-amber-500"
              : "text-chart-3"
        )}
      >
        {value}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">Target: {target}</p>
    </div>
  );
}

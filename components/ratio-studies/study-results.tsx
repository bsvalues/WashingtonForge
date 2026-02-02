"use client";

import React from "react"

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
      <div className="glass-panel rounded-xl p-12 text-center h-[600px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
          <FileBarChart className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium mb-1">Select a Study</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose a ratio study from the list to view detailed results and
          statistics
        </p>
      </div>
    );
  }

  if (study.status === "running" || study.status === "pending") {
    return (
      <div className="glass-panel rounded-xl p-12 text-center h-[600px] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-foreground font-medium mb-1">
          {study.status === "running" ? "Processing..." : "Queued"}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {study.status === "running"
            ? "Computing ratio study metrics. This may take a few moments."
            : "This study is queued and will start processing shortly."}
        </p>
      </div>
    );
  }

  if (study.status === "failed") {
    return (
      <div className="glass-panel rounded-xl p-12 text-center h-[600px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-xl bg-destructive/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-foreground font-medium mb-1">Study Failed</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          This ratio study encountered an error during processing. Please try
          running a new study.
        </p>
      </div>
    );
  }

  const results = study.results;
  if (!results) return null;

  // Determine status based on IAAO standards
  const getMetricStatus = (
    metric: string,
    value: number
  ): "good" | "warning" | "bad" => {
    switch (metric) {
      case "ratio":
        if (value >= 0.95 && value <= 1.05) return "good";
        if (value >= 0.90 && value <= 1.10) return "warning";
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
        if (Math.abs(value) <= 0.10) return "warning";
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
      <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{study.name}</h2>
          <p className="text-sm text-muted-foreground">
            Roll Year {study.rollYear} • {results.sampleSize.toLocaleString()}{" "}
            qualified sales
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="glass-btn border-border/50 text-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("xlsx")}
            disabled={isExporting}
            className="glass-btn border-border/50 text-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Mean Ratio
          </p>
          <p className="text-xl font-semibold text-foreground">
            {results.meanRatio.toFixed(3)}
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Sample Size
            </p>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {results.sampleSize.toLocaleString()}
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Outliers Excluded
            </p>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {results.outlierCount}
          </p>
        </div>
      </div>

      {/* Visualizations */}
      <RatioCharts study={study} />

      {/* Breakdown Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By Neighborhood */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-medium text-foreground">By Neighborhood</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-muted-foreground">
                    Neighborhood
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    Median
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    COD
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    N
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.byNeighborhood.map((n) => (
                  <TableRow key={n.neighborhood} className="border-border/50">
                    <TableCell className="text-foreground">
                      {n.neighborhood}
                    </TableCell>
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
                    <TableCell className="text-right text-muted-foreground">
                      {n.sampleSize}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* By Property Class */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-medium text-foreground">By Property Class</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-muted-foreground">Class</TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    Median
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    COD
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    N
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.byPropertyClass.map((c) => (
                  <TableRow key={c.propertyClass} className="border-border/50">
                    <TableCell className="text-foreground">
                      {c.propertyClass}
                    </TableCell>
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
                    <TableCell className="text-right text-muted-foreground">
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
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center border",
            statusStyles[status]
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
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
      <p className="text-xs text-muted-foreground mt-1">Target: {target}</p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Download,
  Plus,
  CheckCircle,
  Clock,
  Archive,
  FileText,
  Loader2,
  Calendar,
  Database,
  DollarSign,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRollYearSnapshots,
  getRatioStudies,
  exportRatioSnapshot,
  createRollYearSnapshot,
  publishSnapshot,
  type RollYearSnapshot,
  type RatioStudy,
} from "@/lib/api";

// Status colors
const statusColors = {
  draft: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  published: "bg-green-500/20 text-green-400 border-green-500/40",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/40",
};

const statusIcons = {
  draft: Clock,
  published: CheckCircle,
  archived: Archive,
};

// Format currency
const formatCurrency = (value: number) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
};

export function SnapshotsContent() {
  const [snapshots, setSnapshots] = useState<RollYearSnapshot[]>([]);
  const [ratioStudies, setRatioStudies] = useState<RatioStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [snapshotsData, studiesData] = await Promise.all([
          getRollYearSnapshots(),
          getRatioStudies(),
        ]);
        setSnapshots(snapshotsData);
        setRatioStudies(studiesData);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Create new snapshot
  const handleCreateSnapshot = async () => {
    setIsCreating(true);
    try {
      const currentYear = new Date().getFullYear();
      const newSnapshot = await createRollYearSnapshot(currentYear);
      setSnapshots((prev) => [newSnapshot, ...prev]);
    } finally {
      setIsCreating(false);
    }
  };

  // Publish snapshot
  const handlePublish = async (snapshotId: string) => {
    setIsPublishing(snapshotId);
    try {
      const updated = await publishSnapshot(snapshotId);
      setSnapshots((prev) => prev.map((s) => (s.id === snapshotId ? updated : s)));
    } finally {
      setIsPublishing(null);
    }
  };

  // Export ratio snapshot
  const handleExportRatioSnapshot = async (runId: string) => {
    setIsExporting(runId);
    try {
      const blob = await exportRatioSnapshot(runId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ratio-snapshot-${runId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(null);
    }
  };

  // Get ratio study for a snapshot year
  const getRatioStudyForYear = (year: number) => {
    return ratioStudies.find((s) => s.rollYear === year && s.status === "completed");
  };

  return (
    <div className="space-bg min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">Roll Year Snapshots</h1>
            <p className="text-muted-foreground mt-1">
              Immutable snapshots of assessment data with ratio study exports
            </p>
          </div>

          <Button
            onClick={handleCreateSnapshot}
            disabled={isCreating}
            className="tf-glass-btn tf-glass-btn--primary"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New Snapshot
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Snapshots Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {snapshots.map((snapshot) => {
                const StatusIcon = statusIcons[snapshot.status];
                const ratioStudy = getRatioStudyForYear(snapshot.rollYear);

                return (
                  <Card key={snapshot.id} className="tf-glass p-5">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 border-primary/40 flex h-12 w-12 items-center justify-center rounded-lg border">
                          <Camera className="text-primary h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-foreground text-lg font-semibold">
                            Roll Year {snapshot.rollYear}
                          </h3>
                          <p className="text-muted-foreground text-xs">
                            {new Date(snapshot.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                          statusColors[snapshot.status]
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {snapshot.status.charAt(0).toUpperCase() + snapshot.status.slice(1)}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <div className="bg-secondary/30 border-border/30 rounded-lg border p-3">
                        <div className="text-muted-foreground mb-1 flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span className="text-xs">Parcels</span>
                        </div>
                        <p className="text-foreground text-lg font-semibold">
                          {snapshot.parcelCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-secondary/30 border-border/30 rounded-lg border p-3">
                        <div className="text-muted-foreground mb-1 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs">Total AV</span>
                        </div>
                        <p className="text-foreground text-lg font-semibold">
                          {formatCurrency(snapshot.totalAssessedValue)}
                        </p>
                      </div>
                    </div>

                    {/* Ratio Study Info */}
                    {ratioStudy ? (
                      <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">
                            Ratio Study Available
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Median</span>
                            <p className="text-foreground font-mono">
                              {ratioStudy.results?.medianRatio.toFixed(3)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">COD</span>
                            <p className="text-foreground font-mono">
                              {ratioStudy.results?.cod.toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">PRD</span>
                            <p className="text-foreground font-mono">
                              {ratioStudy.results?.prd.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sales</span>
                            <p className="text-foreground font-mono">
                              {ratioStudy.results?.sampleSize}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-amber-400">
                            No ratio study for this year
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {snapshot.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublish(snapshot.id)}
                          disabled={isPublishing === snapshot.id}
                          className="tf-glass-btn text-foreground flex-1 bg-transparent"
                        >
                          {isPublishing === snapshot.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1 h-4 w-4" />
                          )}
                          Publish
                        </Button>
                      )}

                      {ratioStudy && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportRatioSnapshot(ratioStudy.id)}
                          disabled={isExporting === ratioStudy.id}
                          className="tf-glass-btn text-foreground flex-1 bg-transparent"
                        >
                          {isExporting === ratioStudy.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-1 h-4 w-4" />
                          )}
                          Export Ratio
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Ratio Studies List */}
            <Card className="tf-glass p-5">
              <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="text-primary h-5 w-5" />
                Completed Ratio Studies
              </h2>

              <div className="space-y-3">
                {ratioStudies
                  .filter((s) => s.status === "completed")
                  .map((study) => (
                    <div
                      key={study.id}
                      className="bg-secondary/30 border-border/30 flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
                          <FileText className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-foreground font-medium">{study.name}</h3>
                          <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Roll {study.rollYear}
                            </span>
                            <span>|</span>
                            <span>
                              Completed{" "}
                              {study.completedAt
                                ? new Date(study.completedAt).toLocaleDateString()
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Metrics */}
                        <div className="hidden items-center gap-4 text-sm md:flex">
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Median</p>
                            <p className="font-mono font-medium">
                              {study.results?.medianRatio.toFixed(3)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">COD</p>
                            <p className="font-mono font-medium">{study.results?.cod.toFixed(1)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">PRD</p>
                            <p className="font-mono font-medium">{study.results?.prd.toFixed(2)}</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportRatioSnapshot(study.id)}
                          disabled={isExporting === study.id}
                          className="tf-glass-btn text-foreground bg-transparent"
                        >
                          {isExporting === study.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="mr-1 h-4 w-4" />
                              Export
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

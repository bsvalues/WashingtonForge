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
      setSnapshots((prev) =>
        prev.map((s) => (s.id === snapshotId ? updated : s))
      );
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Roll Year Snapshots
            </h1>
            <p className="text-muted-foreground mt-1">
              Immutable snapshots of assessment data with ratio study exports
            </p>
          </div>
          
          <Button
            onClick={handleCreateSnapshot}
            disabled={isCreating}
            className="glass-btn-primary"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                New Snapshot
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Snapshots Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {snapshots.map((snapshot) => {
                const StatusIcon = statusIcons[snapshot.status];
                const ratioStudy = getRatioStudyForYear(snapshot.rollYear);
                
                return (
                  <Card key={snapshot.id} className="glass-panel p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            Roll Year {snapshot.rollYear}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(snapshot.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1",
                        statusColors[snapshot.status]
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {snapshot.status.charAt(0).toUpperCase() + snapshot.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Database className="w-4 h-4" />
                          <span className="text-xs">Parcels</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {snapshot.parcelCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs">Total AV</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {formatCurrency(snapshot.totalAssessedValue)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Ratio Study Info */}
                    {ratioStudy ? (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">Ratio Study Available</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Median</span>
                            <p className="font-mono text-foreground">{ratioStudy.results?.medianRatio.toFixed(3)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">COD</span>
                            <p className="font-mono text-foreground">{ratioStudy.results?.cod.toFixed(1)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">PRD</span>
                            <p className="font-mono text-foreground">{ratioStudy.results?.prd.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sales</span>
                            <p className="font-mono text-foreground">{ratioStudy.results?.sampleSize}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-amber-400">No ratio study for this year</span>
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
                          className="flex-1 glass-btn text-foreground bg-transparent"
                        >
                          {isPublishing === snapshot.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
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
                          className="flex-1 glass-btn text-foreground bg-transparent"
                        >
                          {isExporting === ratioStudy.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-1" />
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
            <Card className="glass-panel p-5">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Completed Ratio Studies
              </h2>
              
              <div className="space-y-3">
                {ratioStudies.filter((s) => s.status === "completed").map((study) => (
                  <div
                    key={study.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{study.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Roll {study.rollYear}
                          </span>
                          <span>|</span>
                          <span>
                            Completed {study.completedAt ? new Date(study.completedAt).toLocaleDateString() : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Metrics */}
                      <div className="hidden md:flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Median</p>
                          <p className="font-mono font-medium">{study.results?.medianRatio.toFixed(3)}</p>
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
                        className="glass-btn text-foreground bg-transparent"
                      >
                        {isExporting === study.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-1" />
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

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getRollYearSnapshots,
  createRollYearSnapshot,
  publishSnapshot,
  type RollYearSnapshot,
} from "@/lib/api";
import {
  Camera,
  Calendar,
  Package,
  DollarSign,
  Check,
  Clock,
  Upload,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SnapshotModal({ isOpen, onClose }: SnapshotModalProps) {
  const [snapshots, setSnapshots] = useState<RollYearSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getRollYearSnapshots()
        .then(setSnapshots)
        .catch((err) => console.error("[v0] Failed to load snapshots:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleCreateSnapshot = async () => {
    setIsCreating(true);
    try {
      const currentYear = new Date().getFullYear();
      const newSnapshot = await createRollYearSnapshot(currentYear);
      setSnapshots((prev) => [newSnapshot, ...prev]);
    } catch (err) {
      console.error("[v0] Failed to create snapshot:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublishSnapshot = async (snapshotId: string) => {
    setIsPublishing(snapshotId);
    try {
      const updated = await publishSnapshot(snapshotId);
      setSnapshots((prev) =>
        prev.map((s) => (s.id === snapshotId ? updated : s))
      );
    } catch (err) {
      console.error("[v0] Failed to publish snapshot:", err);
    } finally {
      setIsPublishing(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-panel border-border/50 max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Camera className="w-5 h-5 text-primary" />
            Roll Year Snapshots
          </DialogTitle>
        </DialogHeader>

        {/* Create New Snapshot */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Create New Snapshot
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Capture current assessment roll for {new Date().getFullYear()}
              </p>
            </div>
            <Button
              onClick={handleCreateSnapshot}
              disabled={isCreating}
              className="glass-btn-primary text-foreground"
              size="sm"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {isCreating ? "Creating..." : "Create Snapshot"}
            </Button>
          </div>
        </div>

        {/* Snapshots List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No snapshots created yet
            </div>
          ) : (
            snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  snapshot.status === "published"
                    ? "bg-chart-1/10 border-chart-1/30"
                    : "bg-secondary/30 border-border/30"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">
                        Roll Year {snapshot.rollYear}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          snapshot.status === "published"
                            ? "bg-chart-1/20 text-chart-1"
                            : "bg-chart-5/20 text-chart-5"
                        )}
                      >
                        {snapshot.status === "published" ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      Created {formatDate(snapshot.createdAt)}
                    </div>
                  </div>

                  {snapshot.status === "draft" && (
                    <Button
                      onClick={() => handlePublishSnapshot(snapshot.id)}
                      disabled={isPublishing === snapshot.id}
                      variant="outline"
                      size="sm"
                      className="glass-btn border-chart-1/40 text-chart-1 hover:bg-chart-1/20 bg-transparent"
                    >
                      {isPublishing === snapshot.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Publish
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Parcels</p>
                      <p className="text-sm font-medium text-foreground">
                        {snapshot.parcelCount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Assessed
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(snapshot.totalAssessedValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

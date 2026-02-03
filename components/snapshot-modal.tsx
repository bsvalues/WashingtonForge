"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      setSnapshots((prev) => prev.map((s) => (s.id === snapshotId ? updated : s)));
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
      <DialogContent className="tf-glass border-border/50 max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Camera className="text-primary h-5 w-5" />
            Roll Year Snapshots
          </DialogTitle>
        </DialogHeader>

        {/* Create New Snapshot */}
        <div className="bg-primary/10 border-primary/30 mb-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-foreground text-sm font-medium">Create New Snapshot</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Capture current assessment roll for {new Date().getFullYear()}
              </p>
            </div>
            <Button
              onClick={handleCreateSnapshot}
              disabled={isCreating}
              className="tf-glass-btn tf-glass-btn--primary text-foreground"
              size="sm"
            >
              {isCreating ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              {isCreating ? "Creating..." : "Create Snapshot"}
            </Button>
          </div>
        </div>

        {/* Snapshots List */}
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
              No snapshots created yet
            </div>
          ) : (
            snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  snapshot.status === "published"
                    ? "bg-chart-1/10 border-chart-1/30"
                    : "bg-secondary/30 border-border/30"
                )}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-foreground font-medium">Roll Year {snapshot.rollYear}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          snapshot.status === "published"
                            ? "bg-chart-1/20 text-chart-1"
                            : "bg-chart-5/20 text-chart-5"
                        )}
                      >
                        {snapshot.status === "published" ? (
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      Created {formatDate(snapshot.createdAt)}
                    </div>
                  </div>

                  {snapshot.status === "draft" && (
                    <Button
                      onClick={() => handlePublishSnapshot(snapshot.id)}
                      disabled={isPublishing === snapshot.id}
                      variant="outline"
                      size="sm"
                      className="tf-glass-btn border-chart-1/40 text-chart-1 hover:bg-chart-1/20 bg-transparent"
                    >
                      {isPublishing === snapshot.id ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Publish
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-muted-foreground text-xs">Parcels</p>
                      <p className="text-foreground text-sm font-medium">
                        {snapshot.parcelCount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-muted-foreground text-xs">Total Assessed</p>
                      <p className="text-foreground text-sm font-medium">
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

"use client";

import { CheckCircle2, Clock, Loader2, XCircle, FileBarChart } from "lucide-react";
import type { RatioStudy } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RatioStudyListProps {
  studies: RatioStudy[];
  selectedStudy: RatioStudy | null;
  onSelectStudy: (study: RatioStudy) => void;
  isLoading: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "text-muted-foreground",
  },
  running: {
    icon: Loader2,
    label: "Running",
    className: "text-primary animate-spin",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "text-chart-1",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "text-destructive",
  },
};

export function RatioStudyList({
  studies,
  selectedStudy,
  onSelectStudy,
  isLoading,
}: RatioStudyListProps) {
  if (isLoading) {
    return (
      <div className="tf-glass rounded-xl p-8 text-center">
        <Loader2 className="text-primary mx-auto mb-3 h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading studies...</p>
      </div>
    );
  }

  if (studies.length === 0) {
    return (
      <div className="tf-glass rounded-xl p-8 text-center">
        <div className="bg-muted/30 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <FileBarChart className="text-muted-foreground h-6 w-6" />
        </div>
        <p className="text-foreground mb-1 font-medium">No Studies Yet</p>
        <p className="text-muted-foreground text-sm">
          Run your first ratio study to analyze assessment equity
        </p>
      </div>
    );
  }

  return (
    <div className="tf-glass overflow-hidden rounded-xl">
      <div className="border-border/50 border-b p-4">
        <h2 className="text-foreground font-medium">Recent Studies</h2>
      </div>
      <div className="divide-border/50 max-h-[600px] divide-y overflow-y-auto">
        {studies.map((study) => {
          const status = statusConfig[study.status];
          const StatusIcon = status.icon;
          const isSelected = selectedStudy?.id === study.id;

          return (
            <button
              key={study.id}
              type="button"
              onClick={() => onSelectStudy(study)}
              className={cn(
                "w-full p-4 text-left transition-colors",
                isSelected ? "bg-primary/10" : "hover:bg-muted/10"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}
                  >
                    {study.name}
                  </p>
                  <p className="text-muted-foreground text-sm">Roll Year {study.rollYear}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(study.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-4 w-4", status.className)} />
                  <span
                    className={cn(
                      "text-xs",
                      study.status === "completed"
                        ? "text-chart-1"
                        : study.status === "failed"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    )}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Quick Stats for Completed */}
              {study.status === "completed" && study.results && (
                <div className="mt-3 flex gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Median: </span>
                    <span className="text-foreground font-medium">
                      {study.results.medianRatio.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">COD: </span>
                    <span className="text-foreground font-medium">
                      {study.results.cod.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import {
  Upload,
  Link2,
  ShieldCheck,
  Database,
  TrendingUp,
  FileBarChart,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataFlowVisualizerProps {
  currentStage?: "ingest" | "validate" | "store" | "analyze" | "report";
  stats?: {
    recordsIngested?: number;
    recordsValidated?: number;
    recordsStored?: number;
    lastUpdated?: string;
  };
}

const stages = [
  {
    id: "ingest",
    label: "Ingest",
    description: "Upload & Map",
    icon: Upload,
    color: "text-blue-400",
    bgColor: "bg-blue-400/20",
  },
  {
    id: "validate",
    label: "Validate",
    description: "Quality Checks",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/20",
  },
  {
    id: "store",
    label: "Store",
    description: "FusionCore DB",
    icon: Database,
    color: "text-purple-400",
    bgColor: "bg-purple-400/20",
  },
  {
    id: "analyze",
    label: "Analyze",
    description: "Ratio Studies",
    icon: TrendingUp,
    color: "text-amber-400",
    bgColor: "bg-amber-400/20",
  },
  {
    id: "report",
    label: "Report",
    description: "IAAO Compliance",
    icon: FileBarChart,
    color: "text-rose-400",
    bgColor: "bg-rose-400/20",
  },
];

export function DataFlowVisualizer({ currentStage = "ingest", stats }: DataFlowVisualizerProps) {
  const currentIndex = useMemo(
    () => stages.findIndex((s) => s.id === currentStage),
    [currentStage]
  );

  return (
    <div className="tf-glass rounded-xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-foreground font-semibold">Data Pipeline</h3>
          <p className="text-muted-foreground text-sm">
            How your data flows through TerraFusion
          </p>
        </div>
        {stats?.lastUpdated && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3" />
            Updated {stats.lastUpdated}
          </div>
        )}
      </div>

      {/* Pipeline Flow */}
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={stage.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center text-center">
                {/* Stage Node */}
                <div
                  className={cn(
                    "relative flex h-14 w-14 items-center justify-center rounded-xl transition-all",
                    isCompleted && `${stage.bgColor} ${stage.color}`,
                    isActive && `${stage.bgColor} ${stage.color} ring-2 ring-offset-2 ring-offset-transparent`,
                    isPending && "bg-muted/30 text-muted-foreground"
                  )}
                  style={
                    isActive
                      ? { "--tw-ring-color": `oklch(0.7 0.15 ${index * 60})` } as React.CSSProperties
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}

                  {/* Pulse for active */}
                  {isActive && (
                    <span
                      className={cn(
                        "absolute inset-0 animate-ping rounded-xl opacity-40",
                        stage.bgColor
                      )}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-3 text-sm font-medium transition-colors",
                    isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
                <span className="text-muted-foreground/70 text-xs">{stage.description}</span>
              </div>

              {/* Connector Arrow */}
              {index < stages.length - 1 && (
                <div className="mx-2 flex flex-1 items-center justify-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                      index < currentIndex
                        ? "bg-chart-1/20 text-chart-1"
                        : "bg-muted/20 text-muted-foreground"
                    )}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border/50 pt-6">
          <div className="text-center">
            <p className="text-foreground text-xl font-semibold">
              {stats.recordsIngested?.toLocaleString() ?? "—"}
            </p>
            <p className="text-muted-foreground text-xs">Records Ingested</p>
          </div>
          <div className="text-center">
            <p className="text-foreground text-xl font-semibold">
              {stats.recordsValidated?.toLocaleString() ?? "—"}
            </p>
            <p className="text-muted-foreground text-xs">Validated</p>
          </div>
          <div className="text-center">
            <p className="text-foreground text-xl font-semibold">
              {stats.recordsStored?.toLocaleString() ?? "—"}
            </p>
            <p className="text-muted-foreground text-xs">In Database</p>
          </div>
        </div>
      )}
    </div>
  );
}

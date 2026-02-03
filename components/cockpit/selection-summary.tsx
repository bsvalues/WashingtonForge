"use client";

import { memo, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { Parcel } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { MatteCard } from "@/components/material";

interface SelectionSummaryProps {
  parcels: Parcel[];
  hiddenCount: number;
}

function SelectionSummaryComponent({ parcels, hiddenCount }: SelectionSummaryProps) {
  const stats = useMemo(() => {
    if (parcels.length === 0) {
      return null;
    }

    // Calculate median ratio
    const ratios = parcels
      .map((p) => p.ratio)
      .filter((r): r is number => r !== undefined && r !== null)
      .sort((a, b) => a - b);

    const medianRatio =
      ratios.length > 0
        ? ratios.length % 2 === 0
          ? (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2
          : ratios[Math.floor(ratios.length / 2)]
        : null;

    // Calculate mean ratio
    const meanRatio =
      ratios.length > 0 ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length : null;

    // Calculate COD (approximate)
    const cod =
      medianRatio && ratios.length > 0
        ? (ratios.reduce((sum, r) => sum + Math.abs(r - medianRatio), 0) /
            ratios.length /
            medianRatio) *
          100
        : null;

    // Count equity distribution
    const equityDist = {
      fair: parcels.filter((p) => p.equityStatus === "fair").length,
      progressive: parcels.filter((p) => p.equityStatus === "progressive").length,
      regressive: parcels.filter((p) => p.equityStatus === "regressive").length,
    };

    // Sales data coverage
    const withSales = parcels.filter((p) => p.salePrice && p.salePrice > 0).length;
    const salesCoverage = (withSales / parcels.length) * 100;

    // Total values
    const totalAssessed = parcels.reduce((sum, p) => sum + p.totalValue, 0);
    const totalSales = parcels
      .filter((p) => p.salePrice)
      .reduce((sum, p) => sum + (p.salePrice || 0), 0);

    return {
      count: parcels.length,
      medianRatio,
      meanRatio,
      cod,
      equityDist,
      salesCoverage,
      withSales,
      totalAssessed,
      totalSales,
    };
  }, [parcels]);

  if (!stats) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        No parcels selected
      </div>
    );
  }

  const total = stats.equityDist.fair + stats.equityDist.progressive + stats.equityDist.regressive;
  const fairPct = total > 0 ? (stats.equityDist.fair / total) * 100 : 0;
  const progressivePct = total > 0 ? (stats.equityDist.progressive / total) * 100 : 0;
  const regressivePct = total > 0 ? (stats.equityDist.regressive / total) * 100 : 0;

  return (
    <div className="space-y-6 p-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MatteCard className="rounded-lg p-3">
          <p className="text-muted-foreground mb-1 text-xs">Count</p>
          <p className="text-foreground text-xl font-semibold">{stats.count}</p>
          {hiddenCount > 0 && <p className="mt-1 text-xs text-amber-400">+{hiddenCount} hidden</p>}
        </MatteCard>

        <MatteCard className="rounded-lg p-3">
          <p className="text-muted-foreground mb-1 text-xs">Median Ratio</p>
          <p
            className={cn(
              "font-mono text-xl font-semibold",
              stats.medianRatio && stats.medianRatio >= 0.9 && stats.medianRatio <= 1.1
                ? "text-emerald-400"
                : "text-amber-400"
            )}
          >
            {stats.medianRatio?.toFixed(3) || "N/A"}
          </p>
        </MatteCard>

        <MatteCard className="rounded-lg p-3">
          <p className="text-muted-foreground mb-1 text-xs">COD</p>
          <p
            className={cn(
              "font-mono text-xl font-semibold",
              stats.cod && stats.cod <= 15 ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {stats.cod?.toFixed(1) || "N/A"}
          </p>
        </MatteCard>

        <MatteCard className="rounded-lg p-3">
          <p className="text-muted-foreground mb-1 text-xs">Total Assessed</p>
          <p className="text-foreground text-xl font-semibold">
            ${(stats.totalAssessed / 1000000).toFixed(1)}M
          </p>
        </MatteCard>
      </div>

      {/* Equity Distribution */}
      <div>
        <p className="text-foreground mb-3 text-sm font-medium">Equity Distribution</p>

        {/* Stacked Bar */}
        <div className="bg-muted/30 flex h-6 overflow-hidden rounded-full">
          {fairPct > 0 && (
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${fairPct}%` }}
            />
          )}
          {progressivePct > 0 && (
            <div
              className="bg-sky-500 transition-all duration-300"
              style={{ width: `${progressivePct}%` }}
            />
          )}
          {regressivePct > 0 && (
            <div
              className="bg-amber-500 transition-all duration-300"
              style={{ width: `${regressivePct}%` }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground text-xs">
              Fair: {stats.equityDist.fair} ({fairPct.toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-sky-500" />
            <span className="text-muted-foreground text-xs">
              Progressive: {stats.equityDist.progressive} ({progressivePct.toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-amber-500" />
            <span className="text-muted-foreground text-xs">
              Regressive: {stats.equityDist.regressive} ({regressivePct.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Sales Coverage Warning */}
      {stats.salesCoverage < 80 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-400">Limited Sales Data</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Only {stats.withSales} of {stats.count} parcels ({stats.salesCoverage.toFixed(0)}%)
              have recent sales data. Ratio metrics may be less reliable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export const SelectionSummary = memo(SelectionSummaryComponent);

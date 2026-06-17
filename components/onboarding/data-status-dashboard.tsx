"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MapPin,
  FileSpreadsheet,
  DollarSign,
  Layers,
  ArrowRight,
  RefreshCw,
  Zap,
  Shield,
  BarChart3,
  Users,
  Scale,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CountyDataStatus, DataLayerStatus } from "@/lib/wa-data/types";
import { checkCapabilities } from "@/lib/wa-data/client";

interface DataStatusDashboardProps {
  status: CountyDataStatus;
  onRefresh?: () => void;
  onNavigate?: (destination: string) => void;
}

const STATUS_CONFIG: Record<
  DataLayerStatus,
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  active: { icon: CheckCircle2, color: "text-green-400", label: "Active" },
  validating: { icon: Clock, color: "text-amber-400", label: "Validating" },
  pending: { icon: Clock, color: "text-blue-400", label: "Pending" },
  stale: { icon: AlertTriangle, color: "text-amber-400", label: "Stale" },
  error: { icon: XCircle, color: "text-red-400", label: "Error" },
  not_configured: { icon: XCircle, color: "text-muted-foreground", label: "Not Configured" },
  not_started: { icon: XCircle, color: "text-muted-foreground", label: "Not Started" },
};

function LayerStatusBadge({ status }: { status: DataLayerStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "active" && "bg-green-400/20 text-green-400",
        status === "validating" && "bg-amber-400/20 text-amber-400",
        status === "pending" && "bg-blue-400/20 text-blue-400",
        status === "stale" && "bg-amber-400/20 text-amber-400",
        status === "error" && "bg-red-400/20 text-red-400",
        status === "not_configured" && "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export function DataStatusDashboard({ status, onRefresh, onNavigate }: DataStatusDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const capabilities = checkCapabilities(status);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate overall progress
  const totalLayers = 3;
  const activeLayers = [
    status.parcel_fabric.status === "active",
    status.county_roll.status === "active",
    status.sales_stream.status === "active",
  ].filter(Boolean).length;
  const progressPct = Math.round((activeLayers / totalLayers) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-xl font-bold">
            {status.county_name} County Data Status
          </h2>
          <p className="text-muted-foreground text-sm">
            {activeLayers} of {totalLayers} data layers active
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="tf-glass-btn"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Overall Progress */}
      <Card className="tf-glass p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-foreground text-sm font-medium">Data Foundation Progress</span>
          <span className="text-primary text-sm font-bold">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
        <p className="text-muted-foreground mt-2 text-xs">
          {progressPct === 100
            ? "All data layers are active. Full capabilities unlocked."
            : "Add more data layers to unlock additional capabilities."}
        </p>
      </Card>

      {/* Data Layers */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Parcel Fabric */}
        <Card className="tf-glass p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  status.parcel_fabric.status === "active" ? "bg-green-400/20" : "bg-muted/50"
                )}
              >
                <MapPin
                  className={cn(
                    "h-5 w-5",
                    status.parcel_fabric.status === "active"
                      ? "text-green-400"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <h3 className="text-foreground font-medium">Parcel Fabric</h3>
                <LayerStatusBadge status={status.parcel_fabric.status} />
              </div>
            </div>
          </div>

          {status.parcel_fabric.status === "active" ? (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcels</span>
                <span className="text-foreground font-medium">
                  {status.parcel_fabric.parcel_count?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coverage</span>
                <span className="text-foreground font-medium">
                  {status.parcel_fabric.coverage_pct}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <span className="text-foreground font-medium">
                  {status.parcel_fabric.source === "wa_statewide"
                    ? "WA Statewide"
                    : "County Provided"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="tf-glass-btn w-full"
                onClick={() => onNavigate?.("onboarding")}
              >
                Load WA Fabric
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* County Roll */}
        <Card className="tf-glass p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  status.county_roll.status === "active" ? "bg-blue-400/20" : "bg-muted/50"
                )}
              >
                <FileSpreadsheet
                  className={cn(
                    "h-5 w-5",
                    status.county_roll.status === "active"
                      ? "text-blue-400"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <h3 className="text-foreground font-medium">County Roll</h3>
                <LayerStatusBadge status={status.county_roll.status} />
              </div>
            </div>
          </div>

          {status.county_roll.status === "active" ? (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Roll Year</span>
                <span className="text-foreground font-medium">{status.county_roll.roll_year}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Records</span>
                <span className="text-foreground font-medium">
                  {status.county_roll.record_count?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mapping Confidence</span>
                <span className="text-foreground font-medium">
                  {status.county_roll.mapping_confidence_pct}%
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="tf-glass-btn w-full"
                onClick={() => onNavigate?.("ingest")}
              >
                Upload Roll Data
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Sales Stream */}
        <Card className="tf-glass p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  status.sales_stream.status === "active" ? "bg-purple-400/20" : "bg-muted/50"
                )}
              >
                <DollarSign
                  className={cn(
                    "h-5 w-5",
                    status.sales_stream.status === "active"
                      ? "text-purple-400"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <h3 className="text-foreground font-medium">Sales Stream</h3>
                <LayerStatusBadge status={status.sales_stream.status} />
              </div>
            </div>
          </div>

          {status.sales_stream.status === "active" ? (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sales</span>
                <span className="text-foreground font-medium">
                  {status.sales_stream.record_count?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date Range</span>
                <span className="text-foreground font-medium">
                  {status.sales_stream.date_range
                    ? `${status.sales_stream.date_range.from.slice(0, 4)}-${status.sales_stream.date_range.to.slice(0, 4)}`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Arms-Length</span>
                <span className="text-foreground font-medium">
                  {status.sales_stream.arms_length_pct}%
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="tf-glass-btn w-full"
                onClick={() => onNavigate?.("ingest")}
              >
                Upload Sales Data
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Capabilities */}
      <Card className="tf-glass p-4">
        <h3 className="text-foreground mb-4 font-medium">Capabilities Unlocked</h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Ready Capabilities */}
          {capabilities.ready.map((cap) => (
            <div key={cap} className="flex items-center gap-3 rounded-lg bg-green-400/10 p-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
              <span className="text-foreground text-sm font-medium">{cap}</span>
            </div>
          ))}

          {/* Pending Capabilities */}
          {capabilities.pending.map((cap) => (
            <div key={cap} className="flex items-center gap-3 rounded-lg bg-amber-400/10 p-3">
              <Clock className="h-5 w-5 shrink-0 text-amber-400" />
              <span className="text-muted-foreground text-sm">{cap}</span>
            </div>
          ))}

          {/* Blocked Capabilities */}
          {capabilities.blocked.map((cap) => (
            <div key={cap} className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
              <XCircle className="text-muted-foreground h-5 w-5 shrink-0" />
              <span className="text-muted-foreground text-sm">{cap}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      {progressPct < 100 && (
        <Card className="tf-glass border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Zap className="text-primary mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">
                {progressPct === 0
                  ? "Get Started"
                  : progressPct < 67
                    ? "Keep Going"
                    : "Almost There"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {status.parcel_fabric.status !== "active"
                  ? "Load the WA Parcel Fabric to see your county on the map."
                  : status.county_roll.status !== "active"
                    ? "Upload your county roll data to enable comps selection."
                    : "Upload sales data to unlock ratio studies and model calibration."}
              </p>
            </div>
            <Button
              size="sm"
              className="tf-glass-btn tf-glass-btn--primary shrink-0"
              onClick={() =>
                onNavigate?.(status.parcel_fabric.status !== "active" ? "onboarding" : "ingest")
              }
            >
              {status.parcel_fabric.status !== "active" ? "Start Onboarding" : "Upload Data"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

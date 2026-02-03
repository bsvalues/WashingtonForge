"use client";

import React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Map,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Activity,
  FileBarChart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/material";
import { cn } from "@/lib/utils";
import { evaluateCompliance, getComplianceLabel, getComplianceBgColor } from "@/lib/compliance";
import { getAuditEvents, setAuditContext, audit } from "@/lib/audit";
import {
  type DatasetVersion,
  type ComplianceResult,
  type AuditLogEntry,
  IAAO_RESIDENTIAL_THRESHOLDS,
} from "@/lib/api/types";
import { MOCK_USER } from "@/lib/fixtures";

// ============================================
// Dashboard Data Types
// ============================================

interface DashboardData {
  county: {
    id: string;
    name: string;
    state: string;
  };
  datasetVersion: DatasetVersion;
  compliance: ComplianceResult;
  equityBreakdown: {
    fair: number;
    progressive: number;
    regressive: number;
  };
  pendingTasks: { id: string; task: string; count: number; href: string }[];
  recentActivity: AuditLogEntry[];
}

// ============================================
// Mock Dataset Version (Single Source of Truth)
// ============================================

const MOCK_DATASET_VERSION: DatasetVersion = {
  id: "dv-2024-001",
  datasetId: "ds-benton-main",
  countyId: "benton",
  rollYear: 2024,
  version: 1,
  status: "published",
  rowCount: 87420,
  createdAt: "2024-01-15T00:00:00Z",
  publishedAt: "2024-01-20T00:00:00Z",
  metrics: {
    totalParcels: 87420,
    totalAssessedValue: 12456000000,
    totalSales: 1842,
    medianRatio: 0.965,
    cod: 12.4,
    prd: 1.02,
    prb: -0.008,
  },
};

// ============================================
// Dashboard Content Component
// ============================================

interface DashboardContentProps {
  datasetVersionId?: string; // Allow passing specific version
}

export function DashboardContent({ datasetVersionId }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize audit context for this session
    setAuditContext({
      userId: MOCK_USER.id,
      userName: MOCK_USER.name,
      countyId: MOCK_USER.countyId,
      datasetVersionId: datasetVersionId || MOCK_DATASET_VERSION.id,
    });

    loadDashboardData();
  }, [datasetVersionId]);

  async function loadDashboardData() {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - in production this would fetch by datasetVersionId
      await new Promise((resolve) => setTimeout(resolve, 600));

      const datasetVersion = MOCK_DATASET_VERSION;
      const metrics = datasetVersion.metrics!;

      // Compute compliance from metrics (not hardcoded)
      const compliance = evaluateCompliance(
        {
          medianRatio: metrics.medianRatio,
          cod: metrics.cod,
          prd: metrics.prd,
          prb: metrics.prb,
        },
        IAAO_RESIDENTIAL_THRESHOLDS
      );

      // Get audit events for recent activity (backed by real audit pipeline)
      const recentActivity = getAuditEvents(10);

      // If no audit events, seed some initial ones
      if (recentActivity.length === 0) {
        audit.login(MOCK_USER.id, MOCK_USER.name, MOCK_USER.countyId);
        audit.cockpitView(MOCK_USER.countyId, {});
      }

      const dashboardData: DashboardData = {
        county: {
          id: MOCK_USER.countyId,
          name: MOCK_USER.countyName,
          state: "WA",
        },
        datasetVersion,
        compliance,
        equityBreakdown: {
          fair: 72,
          progressive: 18,
          regressive: 10,
        },
        pendingTasks: [
          { id: "1", task: "Review flagged parcels", count: 23, href: "/cockpit" },
          { id: "2", task: "Complete Q2 ratio study", count: 1, href: "/ratio-studies" },
          { id: "3", task: "Process appeals", count: 8, href: "/cockpit" },
        ],
        recentActivity: getAuditEvents(5),
      };

      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-bg flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-3 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-bg flex min-h-screen items-center justify-center">
        <div className="tf-glass max-w-md rounded-xl p-8 text-center">
          <XCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
          <h2 className="text-foreground mb-2 text-lg font-semibold">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground mb-4 text-sm">{error || "Unknown error occurred"}</p>
          <GlassButton onClick={loadDashboardData} tone="primary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </GlassButton>
        </div>
      </div>
    );
  }

  const { datasetVersion, compliance } = data;
  const metrics = datasetVersion.metrics!;

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="space-bg min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        {/* Header with Dataset Version Badge */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">{data.county.name} Dashboard</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-muted-foreground">Roll Year {datasetVersion.rollYear}</p>
              <span className="text-muted-foreground">·</span>
              <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                v{datasetVersion.version}
              </span>
              <span className="text-muted-foreground text-xs">({datasetVersion.id})</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/ingest">
              <GlassButton tone="primary" className="border-primary/40 text-foreground border">
                <Upload className="mr-2 h-4 w-4" />
                New Ingest
              </GlassButton>
            </Link>
            <Link href="/ratio-studies">
              <GlassButton variant="outline" className="border-border/50 text-foreground bg-transparent">
                <BarChart3 className="mr-2 h-4 w-4" />
                Run Study
              </GlassButton>
            </Link>
          </div>
        </div>

        {/* IAAO Compliance Banner (Computed, not hardcoded) */}
        <div
          className={cn(
            "tf-glass flex items-center gap-4 rounded-xl border p-4",
            getComplianceBgColor(compliance.overall)
          )}
        >
          {compliance.overall === "compliant" ? (
            <div className="bg-equity-fair/20 flex h-10 w-10 items-center justify-center rounded-lg">
              <CheckCircle2 className="text-equity-fair h-5 w-5" />
            </div>
          ) : compliance.overall === "warning" ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/20">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
          ) : (
            <div className="bg-equity-regressive/20 flex h-10 w-10 items-center justify-center rounded-lg">
              <XCircle className="text-equity-regressive h-5 w-5" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-foreground font-medium">{getComplianceLabel(compliance.overall)}</p>
            <p className="text-muted-foreground text-sm">{compliance.details[0]}</p>
          </div>
          <Link href="/ratio-studies">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              View Details
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* KPI Cards (Derived from DatasetVersion metrics) */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KPICard
            label="Total Parcels"
            value={metrics.totalParcels.toLocaleString()}
            icon={Building2}
            trend={+2.6}
          />
          <KPICard
            label="Assessed Value"
            value={formatCurrency(metrics.totalAssessedValue)}
            icon={DollarSign}
            trend={+10.9}
          />
          <KPICard
            label="Median Ratio"
            value={metrics.medianRatio.toFixed(3)}
            icon={TrendingUp}
            status={compliance.ratio}
            target="0.90-1.10"
          />
          <KPICard
            label="COD"
            value={`${metrics.cod.toFixed(1)}%`}
            icon={Activity}
            status={compliance.cod}
            target="≤15%"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Equity Distribution + PRD/PRB */}
          <div className="tf-glass rounded-xl p-5 md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-foreground font-semibold">Equity Distribution</h2>
              <Link href="/cockpit">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  View Map
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <EquityBar
                label="Fair (0.95-1.05)"
                percentage={data.equityBreakdown.fair}
                color="bg-equity-fair"
              />
              <EquityBar
                label="Progressive (<0.95)"
                percentage={data.equityBreakdown.progressive}
                color="bg-equity-progressive"
              />
              <EquityBar
                label="Regressive (>1.05)"
                percentage={data.equityBreakdown.regressive}
                color="bg-equity-regressive"
              />
            </div>

            <div className="border-border/30 mt-6 grid grid-cols-2 gap-4 border-t pt-4">
              <MetricTile
                label="PRD"
                value={metrics.prd.toFixed(3)}
                status={compliance.prd}
                target="0.98-1.03"
                description={
                  metrics.prd > 1.03
                    ? "Regressive (high-value under-assessed)"
                    : metrics.prd < 0.98
                      ? "Progressive (low-value under-assessed)"
                      : "Vertical equity maintained"
                }
              />
              <MetricTile
                label="PRB"
                value={metrics.prb.toFixed(3)}
                status={compliance.prb}
                target="±0.05"
                description={
                  metrics.prb > 0.05
                    ? "Regressive bias detected"
                    : metrics.prb < -0.05
                      ? "Progressive bias detected"
                      : "No significant bias"
                }
              />
            </div>
          </div>

          {/* Pending Tasks (Executable workflows) */}
          <div className="tf-glass rounded-xl p-5">
            <h2 className="text-foreground mb-4 font-semibold">Pending Tasks</h2>
            <div className="space-y-3">
              {data.pendingTasks.map((task) => (
                <Link key={task.id} href={task.href}>
                  <div className="bg-muted/20 hover:bg-muted/30 flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors">
                    <span className="text-foreground text-sm">{task.task}</span>
                    <span className="bg-primary/20 text-primary rounded-full px-2 py-1 text-xs font-medium">
                      {task.count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity (Backed by Audit Events) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <div className="tf-glass rounded-xl p-5">
            <h2 className="text-foreground mb-4 font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionCard
                icon={Map}
                label="View Cockpit"
                href="/cockpit"
                description="Interactive map"
              />
              <QuickActionCard
                icon={Upload}
                label="Ingest Data"
                href="/ingest"
                description="Upload parcels"
              />
              <QuickActionCard
                icon={BarChart3}
                label="Ratio Studies"
                href="/ratio-studies"
                description="Run analysis"
              />
              <QuickActionCard
                icon={FileBarChart}
                label="Reports"
                href="/ratio-studies"
                description="Export data"
              />
            </div>
          </div>

          {/* Recent Activity (From Audit Pipeline) */}
          <div className="tf-glass rounded-xl p-5">
            <h2 className="text-foreground mb-4 font-semibold">Recent Activity</h2>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">No recent activity</p>
              ) : (
                data.recentActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-2 h-2 w-2 rounded-full",
                        event.action.includes("PUBLISH") || event.action.includes("COMPLETE")
                          ? "bg-equity-fair"
                          : event.action.includes("LOGIN") || event.action.includes("VIEW")
                            ? "bg-primary"
                            : "bg-yellow-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm">
                        {formatAuditAction(event.action)}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  status?: "compliant" | "warning" | "non-compliant";
  target?: string;
}

function KPICard({ label, value, icon: Icon, trend, status, target }: KPICardProps) {
  return (
    <div className="tf-glass rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            status === "compliant"
              ? "bg-equity-fair/20 text-equity-fair"
              : status === "warning"
                ? "bg-yellow-400/20 text-yellow-400"
                : status === "non-compliant"
                  ? "bg-equity-regressive/20 text-equity-regressive"
                  : "bg-primary/20 text-primary"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-muted-foreground text-xs tracking-wide uppercase">{label}</span>
      </div>
      <p
        className={cn(
          "text-2xl font-semibold",
          status === "compliant"
            ? "text-equity-fair"
            : status === "warning"
              ? "text-yellow-400"
              : status === "non-compliant"
                ? "text-equity-regressive"
                : "text-foreground"
        )}
      >
        {value}
      </p>
      {trend !== undefined && (
        <div className="mt-1 flex items-center gap-1">
          {trend >= 0 ? (
            <TrendingUp className="text-equity-fair h-3 w-3" />
          ) : (
            <TrendingDown className="text-equity-regressive h-3 w-3" />
          )}
          <span
            className={cn("text-xs", trend >= 0 ? "text-equity-fair" : "text-equity-regressive")}
          >
            {trend >= 0 ? "+" : ""}
            {trend}% YoY
          </span>
        </div>
      )}
      {target && <p className="text-muted-foreground mt-1 text-xs">Target: {target}</p>}
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: string;
  status: "compliant" | "warning" | "non-compliant";
  target: string;
  description: string;
}

function MetricTile({ label, value, status, target, description }: MetricTileProps) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p
        className={cn(
          "text-xl font-semibold",
          status === "compliant"
            ? "text-equity-fair"
            : status === "warning"
              ? "text-yellow-400"
              : "text-equity-regressive"
        )}
      >
        {value}
      </p>
      <p className="text-muted-foreground text-xs">Target: {target}</p>
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
    </div>
  );
}

interface EquityBarProps {
  label: string;
  percentage: number;
  color: string;
}

function EquityBar({ label, percentage, color }: EquityBarProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-foreground text-sm">{label}</span>
        <span className="text-foreground text-sm font-medium">{percentage}%</span>
      </div>
      <div className="bg-muted/30 h-2 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ElementType;
  label: string;
  href: string;
  description: string;
}

function QuickActionCard({ icon: Icon, label, href, description }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <div className="bg-muted/20 hover:bg-muted/30 group cursor-pointer rounded-lg p-4 transition-colors">
        <div className="bg-primary/20 group-hover:bg-primary/30 mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
          <Icon className="text-primary h-5 w-5" />
        </div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </Link>
  );
}

// ============================================
// Utility Functions
// ============================================

function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    AUTH_LOGIN: "User logged in",
    AUTH_LOGOUT: "User logged out",
    INGEST_UPLOAD: "Data uploaded",
    INGEST_VALIDATE: "Validation completed",
    INGEST_PUBLISH: "Dataset published",
    DATASET_PUBLISH: "Dataset published",
    RATIO_RUN_CREATE: "Ratio study started",
    RATIO_RUN_COMPLETE: "Ratio study completed",
    RATIO_EXPORT: "Report exported",
    COCKPIT_VIEW: "Viewed cockpit",
    COCKPIT_SELECT: "Selected parcels",
    SNAPSHOT_CREATE: "Snapshot created",
    SNAPSHOT_PUBLISH: "Snapshot published",
  };
  return actionMap[action] || action.replace(/_/g, " ").toLowerCase();
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

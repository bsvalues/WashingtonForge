"use client";

import React from "react"

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
  Zap,
  Radio,
} from "lucide-react";
import { CommitmentButton } from "@/components/ui/commitment-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  evaluateCompliance,
  getComplianceLabel,
  getComplianceBgColor,
} from "@/lib/compliance";
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
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center glass-panel rounded-xl p-8 max-w-md">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error || "Unknown error occurred"}
          </p>
          <Button onClick={loadDashboardData} className="glass-btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
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
    <div>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        {/* Header with Dataset Version Badge */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {data.county.name} Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">
                Roll Year {datasetVersion.rollYear}
              </p>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                v{datasetVersion.version}
              </span>
              <span className="text-xs text-muted-foreground">
                ({datasetVersion.id})
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/ingest">
              <Button className="glass-btn-primary border border-primary/40 text-foreground">
                <Upload className="w-4 h-4 mr-2" />
                New Ingest
              </Button>
            </Link>
            <Link href="/ratio-studies">
              <Button
                variant="outline"
                className="glass-btn border-border/50 text-foreground bg-transparent"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Run Study
              </Button>
            </Link>
          </div>
        </div>

        {/* IAAO Compliance Banner (Computed, not hardcoded) */}
        <div
          className={cn(
            "glass-panel rounded-xl p-4 flex items-center gap-4 border",
            getComplianceBgColor(compliance.overall)
          )}
        >
          {compliance.overall === "compliant" ? (
            <div className="w-10 h-10 rounded-lg bg-equity-fair/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-equity-fair" />
            </div>
          ) : compliance.overall === "warning" ? (
            <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-equity-regressive/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-equity-regressive" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {getComplianceLabel(compliance.overall)}
            </p>
            <p className="text-sm text-muted-foreground">
              {compliance.details[0]}
            </p>
          </div>
          <Link href="/ratio-studies">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              View Details
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Next Required Step -- "I always know what to do next." */}
        {data.pendingTasks.length > 0 && (
          <div className="glass-panel rounded-xl p-5 border border-neon-amber/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-amber/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4 relative">
              <div className="w-10 h-10 rounded-lg bg-neon-amber/15 border border-neon-amber/25 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-neon-amber" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-neon-amber font-medium mb-1">
                  Next Required Step
                </p>
                <p className="text-sm font-medium text-foreground">
                  {data.pendingTasks[0].task}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.pendingTasks[0].count} item{data.pendingTasks[0].count !== 1 ? "s" : ""} awaiting action
                </p>
              </div>
              <Link href={data.pendingTasks[0].href}>
                <CommitmentButton icon={<ArrowRight className="w-4 h-4" />}>
                  Go
                </CommitmentButton>
              </Link>
            </div>
          </div>
        )}

        {/* KPI Cards (Derived from DatasetVersion metrics) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="grid md:grid-cols-3 gap-6">
          {/* Equity Distribution + PRD/PRB */}
          <div className="md:col-span-2 glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Equity Distribution</h2>
              <Link href="/cockpit">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  View Map
                  <ArrowRight className="w-4 h-4 ml-1" />
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

            <div className="mt-6 pt-4 border-t border-border/30 grid grid-cols-2 gap-4">
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
          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Pending Tasks</h2>
            <div className="space-y-3">
              {data.pendingTasks.map((task) => (
                <Link key={task.id} href={task.href}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
                    <span className="text-sm text-foreground">{task.task}</span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                      {task.count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity (Backed by Audit Events) */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
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
          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                data.recentActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        event.action.includes("PUBLISH") ||
                          event.action.includes("COMPLETE")
                          ? "bg-equity-fair"
                          : event.action.includes("LOGIN") ||
                              event.action.includes("VIEW")
                            ? "bg-primary"
                            : "bg-yellow-400"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {formatAuditAction(event.action)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
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
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            status === "compliant"
              ? "bg-equity-fair/20 text-equity-fair"
              : status === "warning"
                ? "bg-yellow-400/20 text-yellow-400"
                : status === "non-compliant"
                  ? "bg-equity-regressive/20 text-equity-regressive"
                  : "bg-primary/20 text-primary"
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
        <div className="flex items-center gap-1 mt-1">
          {trend >= 0 ? (
            <TrendingUp className="w-3 h-3 text-equity-fair" />
          ) : (
            <TrendingDown className="w-3 h-3 text-equity-regressive" />
          )}
          <span
            className={cn(
              "text-xs",
              trend >= 0 ? "text-equity-fair" : "text-equity-regressive"
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend}% YoY
          </span>
        </div>
      )}
      {target && (
        <p className="text-xs text-muted-foreground mt-1">Target: {target}</p>
      )}
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
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
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
      <p className="text-xs text-muted-foreground">Target: {target}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
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
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{percentage}%</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
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

function QuickActionCard({
  icon: Icon,
  label,
  href,
  description,
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
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

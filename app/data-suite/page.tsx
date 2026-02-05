"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Upload,
  Shield,
  GitBranch,
  Route,
  ScrollText,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  ChevronRight,
  FileText,
  BarChart3,
  Map,
  Target,
  Scale,
} from "lucide-react";
import {
  dataSuiteHub,
  eventBus,
  repository,
  type DataSuiteEvent,
  type WACountyFips,
  type CountyDataStatus,
  type DataProductType,
  DATA_PRODUCTS,
  WA_COUNTIES,
} from "@/lib/data-suite";
import { cn } from "@/lib/utils";

// ============================================
// IDS Dashboard - The "Data Command Center"
// ============================================

type IDSTab = "inventory" | "ingest" | "quality" | "versions" | "routing" | "audit";

const tabs: { id: IDSTab; label: string; icon: typeof Database }[] = [
  { id: "inventory", label: "Inventory", icon: Database },
  { id: "ingest", label: "Ingest", icon: Upload },
  { id: "quality", label: "Quality", icon: Shield },
  { id: "versions", label: "Versions", icon: GitBranch },
  { id: "routing", label: "Routing", icon: Route },
  { id: "audit", label: "Audit", icon: ScrollText },
];

export default function DataSuitePage() {
  const [selectedCounty, setSelectedCounty] = useState<WACountyFips | null>("53005"); // Default: Benton
  const [activeTab, setActiveTab] = useState<IDSTab>("inventory");
  const [status, setStatus] = useState<CountyDataStatus | null>(null);
  const [events, setEvents] = useState<DataSuiteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load county status
  const loadStatus = useCallback(async () => {
    if (!selectedCounty) return;

    setIsLoading(true);
    try {
      // Initialize demo data if needed
      let countyStatus = await dataSuiteHub.getStatus(selectedCounty);
      if (!countyStatus) {
        const countyInfo = WA_COUNTIES[selectedCounty];
        await repository.initializeDemoCounty(selectedCounty, countyInfo?.name || "Unknown County");
        countyStatus = await dataSuiteHub.getStatus(selectedCounty);
      }
      setStatus(countyStatus);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCounty]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Subscribe to events
  useEffect(() => {
    const unsubscribe = eventBus.subscribe((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 50));
    });
    return unsubscribe;
  }, []);

  const countyOptions = Object.entries(WA_COUNTIES).map(([fips, info]) => ({
    value: fips as WACountyFips,
    label: info.name,
  }));

  return (
    <AppShell user={{ name: "Demo User", role: "Assessor", county: status?.county_name || "Select County" }}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              Intelligent Data Suite
            </h1>
            <p className="text-muted-foreground mt-1">
              Your data command center - inventory, quality, versions, and routing in one place
            </p>
          </div>

          {/* County Selector */}
          <div className="flex items-center gap-3">
            <Select
              value={selectedCounty || undefined}
              onValueChange={(v) => setSelectedCounty(v as WACountyFips)}
            >
              <SelectTrigger className="tf-glass w-[200px]">
                <SelectValue placeholder="Select county..." />
              </SelectTrigger>
              <SelectContent>
                {countyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={loadStatus}
              disabled={isLoading}
              className="tf-glass-btn"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Readiness Summary Bar */}
        {status && (
          <Card className="tf-glass mb-6 p-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Overall Score */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold",
                    status.overall_readiness_pct >= 80
                      ? "bg-emerald-400/20 text-emerald-400"
                      : status.overall_readiness_pct >= 50
                        ? "bg-amber-400/20 text-amber-400"
                        : "bg-red-400/20 text-red-400"
                  )}
                >
                  {status.overall_readiness_pct}%
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">Data Readiness</p>
                  <p className="text-muted-foreground text-xs">
                    {status.capabilities_unlocked.length} capabilities unlocked
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="bg-border hidden h-10 w-px sm:block" />

              {/* Product Status Pills */}
              <div className="flex flex-wrap gap-2">
                <ProductStatusPill
                  label="Fabric"
                  status={status.parcel_fabric.status}
                  count={status.parcel_fabric.parcel_count}
                />
                <ProductStatusPill
                  label="Roll"
                  status={status.county_roll.status}
                  count={status.county_roll.total_records}
                />
                <ProductStatusPill
                  label="Sales"
                  status={status.sales_stream.status}
                  count={status.sales_stream.total_sales}
                />
              </div>

              {/* Divider */}
              <div className="bg-border hidden h-10 w-px sm:block" />

              {/* Last Activity */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">
                  Last update: {new Date(status.last_updated).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IDSTab)}>
          <TabsList className="tf-glass mb-6 flex flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <InventoryPanel status={status} onRefresh={loadStatus} />
          </TabsContent>

          {/* Ingest Tab */}
          <TabsContent value="ingest">
            <IngestPanel countyFips={selectedCounty} onComplete={loadStatus} />
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality">
            <QualityPanel countyFips={selectedCounty} status={status} />
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions">
            <VersionsPanel countyFips={selectedCounty} />
          </TabsContent>

          {/* Routing Tab */}
          <TabsContent value="routing">
            <RoutingPanel countyFips={selectedCounty} events={events} />
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <AuditPanel countyFips={selectedCounty} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

// ============================================
// Product Status Pill
// ============================================

function ProductStatusPill({
  label,
  status,
  count,
}: {
  label: string;
  status: "active" | "stale" | "loading" | "not_started" | "error";
  count?: number;
}) {
  const statusConfig = {
    active: { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10" },
    stale: { icon: AlertCircle, color: "text-amber-400 bg-amber-400/10" },
    loading: { icon: RefreshCw, color: "text-blue-400 bg-blue-400/10" },
    not_started: { icon: Clock, color: "text-muted-foreground bg-muted/20" },
    error: { icon: AlertCircle, color: "text-red-400 bg-red-400/10" },
  };

  const config = statusConfig[status] || statusConfig.not_started;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-sm", config.color)}>
      <Icon className={cn("h-3.5 w-3.5", status === "loading" && "animate-spin")} />
      <span className="font-medium">{label}</span>
      {count !== undefined && (
        <span className="text-muted-foreground text-xs">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

// ============================================
// Inventory Panel
// ============================================

function InventoryPanel({
  status,
  onRefresh,
}: {
  status: CountyDataStatus | null;
  onRefresh: () => void;
}) {
  if (!status) {
    return (
      <Card className="tf-glass p-8 text-center">
        <Database className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <p className="text-muted-foreground">Select a county to view data inventory</p>
      </Card>
    );
  }

  const products: {
    type: DataProductType;
    name: string;
    icon: typeof Database;
    status: "active" | "stale" | "loading" | "not_started" | "error";
    count: number;
    coverage: number;
    lastSync: string | null;
    nextRefresh: string | null;
  }[] = [
    {
      type: "PARCEL_FABRIC",
      name: "Parcel Fabric",
      icon: Map,
      status: status.parcel_fabric.status,
      count: status.parcel_fabric.parcel_count || 0,
      coverage: status.parcel_fabric.coverage_pct || 0,
      lastSync: status.parcel_fabric.last_sync || null,
      nextRefresh: status.parcel_fabric.next_refresh_at || null,
    },
    {
      type: "COUNTY_ROLL",
      name: "County Roll",
      icon: FileText,
      status: status.county_roll.status,
      count: status.county_roll.total_records || 0,
      coverage: status.county_roll.join_rate_pct || 0,
      lastSync: status.county_roll.last_sync || null,
      nextRefresh: status.county_roll.next_refresh_at || null,
    },
    {
      type: "SALES_STREAM",
      name: "Sales Stream",
      icon: BarChart3,
      status: status.sales_stream.status,
      count: status.sales_stream.total_sales || 0,
      coverage: status.sales_stream.arms_length_pct || 0,
      lastSync: status.sales_stream.last_sync || null,
      nextRefresh: status.sales_stream.next_refresh_at || null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Product Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product) => (
          <Card key={product.type} className="tf-glass p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <product.icon className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-foreground font-medium">{product.name}</h3>
                  <ProductStatusPill label={product.status} status={product.status} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Records</span>
                <span className="text-foreground font-medium">
                  {product.count.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {product.type === "SALES_STREAM" ? "Arms-Length" : "Coverage"}
                </span>
                <span className="text-foreground font-medium">
                  {product.coverage.toFixed(1)}%
                </span>
              </div>
              {product.lastSync && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="text-foreground">
                    {new Date(product.lastSync).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="tf-glass-btn mt-4 w-full"
              onClick={onRefresh}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh
            </Button>
          </Card>
        ))}
      </div>

      {/* Capabilities Unlocked */}
      <Card className="tf-glass p-5">
        <h3 className="text-foreground mb-4 font-medium">Capabilities Unlocked</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { id: "cockpit_map", name: "Cockpit Map", icon: Map },
            { id: "ratio_studies", name: "Ratio Studies", icon: BarChart3 },
            { id: "comps_selection", name: "Comps Selection", icon: Target },
            { id: "model_calibration", name: "Model Calibration", icon: Zap },
            { id: "appeals_support", name: "Appeals Support", icon: Scale },
          ].map((cap) => {
            const isUnlocked = status.capabilities_unlocked.includes(cap.id);
            return (
              <div
                key={cap.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg p-3 text-sm",
                  isUnlocked ? "bg-emerald-400/10 text-emerald-400" : "bg-muted/20 text-muted-foreground"
                )}
              >
                <cap.icon className="h-4 w-4" />
                <span className="font-medium">{cap.name}</span>
                {isUnlocked && <CheckCircle2 className="ml-auto h-4 w-4" />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Ingest Panel (Simplified - links to /ingest)
// ============================================

function IngestPanel({
  countyFips,
  onComplete,
}: {
  countyFips: WACountyFips | null;
  onComplete: () => void;
}) {
  return (
    <Card className="tf-glass p-8">
      <div className="mx-auto max-w-md text-center">
        <Upload className="text-primary mx-auto mb-4 h-12 w-12" />
        <h3 className="text-foreground mb-2 text-xl font-semibold">Start New Ingest</h3>
        <p className="text-muted-foreground mb-6">
          Upload files, connect feeds, or pull from WA Geo Portal with guided validation and
          field mapping.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="tf-glass-btn tf-glass-btn--primary">
            <a href="/ingest">
              <Upload className="mr-2 h-4 w-4" />
              Go to Ingest Wizard
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" className="tf-glass-btn">
            <a href="/onboarding">
              <Zap className="mr-2 h-4 w-4" />
              Quick Start
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Quality Panel
// ============================================

function QualityPanel({
  countyFips,
  status,
}: {
  countyFips: WACountyFips | null;
  status: CountyDataStatus | null;
}) {
  if (!status || !countyFips) {
    return (
      <Card className="tf-glass p-8 text-center">
        <Shield className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <p className="text-muted-foreground">Select a county to view quality metrics</p>
      </Card>
    );
  }

  const joinRate = status.county_roll.join_rate_pct || 0;
  const armsLengthRate = status.sales_stream.arms_length_pct || 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="tf-glass p-5">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            <h4 className="text-foreground font-medium">Join Match Rate</h4>
          </div>
          <p className={cn(
            "text-3xl font-bold",
            joinRate >= 95 ? "text-emerald-400" : joinRate >= 85 ? "text-amber-400" : "text-red-400"
          )}>
            {joinRate.toFixed(1)}%
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Parcels matched between fabric and roll
          </p>
        </Card>

        <Card className="tf-glass p-5">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="text-primary h-5 w-5" />
            <h4 className="text-foreground font-medium">Arms-Length Sales</h4>
          </div>
          <p className={cn(
            "text-3xl font-bold",
            armsLengthRate >= 80 ? "text-emerald-400" : armsLengthRate >= 60 ? "text-amber-400" : "text-red-400"
          )}>
            {armsLengthRate.toFixed(1)}%
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Valid for ratio study inclusion
          </p>
        </Card>

        <Card className="tf-glass p-5">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="text-primary h-5 w-5" />
            <h4 className="text-foreground font-medium">Validation Pass</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-400">98.2%</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Records passing all validation rules
          </p>
        </Card>
      </div>

      {/* Link to detailed quality */}
      <Card className="tf-glass p-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-foreground font-medium">Detailed Quality Analysis</h4>
            <p className="text-muted-foreground text-sm">
              View join mismatches, validation exceptions, and suggested fixes
            </p>
          </div>
          <Button asChild variant="outline" className="tf-glass-btn">
            <a href="/onboarding?tab=quality">
              View Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Versions Panel
// ============================================

function VersionsPanel({ countyFips }: { countyFips: WACountyFips | null }) {
  const [versions, setVersions] = useState<
    Array<{
      id: string;
      version_label: string;
      created_at: string;
      row_count: number;
      approved_by: string;
      is_current: boolean;
      change_summary?: {
        rows_added: number;
        rows_modified: number;
        rows_removed: number;
        value_delta?: number;
      };
    }>
  >([]);

  useEffect(() => {
    if (!countyFips) return;

    // Load versions from repository
    repository.getVersions(countyFips, "COUNTY_ROLL", 10).then(setVersions);
  }, [countyFips]);

  if (!countyFips) {
    return (
      <Card className="tf-glass p-8 text-center">
        <GitBranch className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <p className="text-muted-foreground">Select a county to view version history</p>
      </Card>
    );
  }

  return (
    <Card className="tf-glass overflow-hidden">
      <div className="border-border/50 flex items-center justify-between border-b p-4">
        <h3 className="text-foreground font-medium">County Roll Versions</h3>
        <Button variant="outline" size="sm" className="tf-glass-btn">
          <GitBranch className="mr-2 h-3.5 w-3.5" />
          Compare
        </Button>
      </div>
      <div className="divide-border/50 divide-y">
        {versions.map((version) => (
          <div key={version.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  version.is_current
                    ? "bg-emerald-400/20 text-emerald-400"
                    : "bg-muted/20 text-muted-foreground"
                )}
              >
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-medium">{version.version_label}</p>
                  {version.is_current && (
                    <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-xs text-emerald-400">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {new Date(version.created_at).toLocaleString()} by {version.approved_by}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {version.change_summary && (
                <div className="text-right text-sm">
                  <span className="text-emerald-400">+{version.change_summary.rows_added}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-amber-400">~{version.change_summary.rows_modified}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-red-400">-{version.change_summary.rows_removed}</span>
                </div>
              )}
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================
// Routing Panel
// ============================================

function RoutingPanel({
  countyFips,
  events,
}: {
  countyFips: WACountyFips | null;
  events: DataSuiteEvent[];
}) {
  const routingEvents = events.filter(
    (e) => e.type === "routing.completed" || e.type === "product.published"
  );

  return (
    <div className="space-y-6">
      {/* Routing Map */}
      <Card className="tf-glass p-5">
        <h3 className="text-foreground mb-4 font-medium">Data Routing Map</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {(["PARCEL_FABRIC", "COUNTY_ROLL", "SALES_STREAM"] as DataProductType[]).map((product) => {
            const targets = DATA_PRODUCTS[product].routingTargets;
            return (
              <div key={product} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Database className="text-primary h-4 w-4" />
                  {DATA_PRODUCTS[product].displayName}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {targets.map((target) => (
                    <span
                      key={target}
                      className="bg-muted/30 text-muted-foreground rounded-full px-2 py-1 text-xs"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Routing Events */}
      <Card className="tf-glass overflow-hidden">
        <div className="border-border/50 border-b p-4">
          <h3 className="text-foreground font-medium">Recent Routing Activity</h3>
        </div>
        <div className="divide-border/50 max-h-96 divide-y overflow-y-auto">
          {routingEvents.length === 0 ? (
            <div className="p-8 text-center">
              <Route className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No routing activity yet</p>
            </div>
          ) : (
            routingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="bg-emerald-400/20 flex h-8 w-8 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {event.type === "product.published"
                      ? `Published ${(event.payload as Record<string, unknown>).product}`
                      : `Routed to ${(event.payload as Record<string, unknown>).subscriber}`}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Audit Panel
// ============================================

function AuditPanel({ countyFips }: { countyFips: WACountyFips | null }) {
  const [lineage, setLineage] = useState<
    Array<{
      id: string;
      event_type: string;
      version_id?: string;
      actor: string;
      timestamp: string;
      details?: Record<string, unknown>;
    }>
  >([]);

  useEffect(() => {
    if (!countyFips) return;
    repository.getLineageEvents(countyFips, undefined, 20).then(setLineage);
  }, [countyFips]);

  if (!countyFips) {
    return (
      <Card className="tf-glass p-8 text-center">
        <ScrollText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <p className="text-muted-foreground">Select a county to view audit trail</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <Card className="tf-glass p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-foreground font-medium">Court-Ready Exports</h3>
            <p className="text-muted-foreground text-sm">
              Generate defensible audit packets for appeals or compliance
            </p>
          </div>
          <Button className="tf-glass-btn tf-glass-btn--primary">
            <FileText className="mr-2 h-4 w-4" />
            Export Packet
          </Button>
        </div>
      </Card>

      {/* Lineage Events */}
      <Card className="tf-glass overflow-hidden">
        <div className="border-border/50 border-b p-4">
          <h3 className="text-foreground font-medium">Audit Trail</h3>
        </div>
        <div className="divide-border/50 divide-y">
          {lineage.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <ScrollText className="text-primary h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium capitalize">
                  {event.event_type.replace(/_/g, " ")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {event.actor} - {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
              {event.version_id && (
                <span className="bg-muted/30 text-muted-foreground rounded px-2 py-1 text-xs font-mono">
                  {event.version_id.slice(0, 12)}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

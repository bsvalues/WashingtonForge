"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  ChevronRight,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  FileText,
  Zap,
  BarChart3,
  Target,
  AlertTriangle,
  Scale,
  Map,
} from "lucide-react";
import {
  dataSuiteHub,
  eventBus,
  repository,
  DataSuiteProvider,
  useDataSuite,
  useEventStream,
  type DataSuiteEvent,
  type WACountyFips,
  type CountyDataStatus,
  type DataProductType,
  DATA_PRODUCTS,
  WA_COUNTIES,
} from "@/lib/data-suite";
import { SmartUploadStep } from "@/components/ingest/smart-upload-step";
import { SmartMapFieldsStep } from "@/components/ingest/smart-map-fields-step";
import { ValidateStep } from "@/components/ingest/validate-step";
import { PreviewStep } from "@/components/ingest/preview-step";
import { PublishStep } from "@/components/ingest/publish-step";
import { EnhancedIngestStepper } from "@/components/ingest/enhanced-ingest-stepper";
import { JoinQualityDashboard } from "@/components/onboarding/join-quality-dashboard";
import { CountyOnboardingWizard } from "@/components/onboarding/county-onboarding-wizard";
import type { Dataset, ValidationResult, FieldMapping } from "@/lib/api";
import { cn } from "@/lib/utils";

// ============================================
// IDS Dashboard - The "Data Command Center"
// ============================================

type IDSTab = "inventory" | "onboarding" | "ingest" | "quality" | "versions" | "routing" | "audit";

const tabs: { id: IDSTab; label: string; icon: typeof Database }[] = [
  { id: "inventory", label: "Inventory", icon: Database },
  { id: "onboarding", label: "Onboarding", icon: Zap },
  { id: "ingest", label: "Ingest", icon: Upload },
  { id: "quality", label: "Quality", icon: Shield },
  { id: "versions", label: "Versions", icon: GitBranch },
  { id: "routing", label: "Routing", icon: Route },
  { id: "audit", label: "Audit", icon: ScrollText },
];

function DataSuitePageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as IDSTab | null;

  const [selectedCounty, setSelectedCounty] = useState<WACountyFips | null>("53005"); // Default: Benton
  const [activeTab, setActiveTab] = useState<IDSTab>(
    tabParam && tabs.some((t) => t.id === tabParam) ? tabParam : "inventory"
  );
  const [status, setStatus] = useState<CountyDataStatus | null>(null);
  const [events, setEvents] = useState<DataSuiteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync tab with URL param
  useEffect(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

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
    <AppShell
      user={{
        name: "Demo User",
        role: "Assessor",
        countyName: status?.county_name || "Select County",
      }}
    >
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
                    (status.overall_readiness_pct ?? 0) >= 80
                      ? "bg-emerald-400/20 text-emerald-400"
                      : (status.overall_readiness_pct ?? 0) >= 50
                        ? "bg-amber-400/20 text-amber-400"
                        : "bg-red-400/20 text-red-400"
                  )}
                >
                  {status.overall_readiness_pct ?? 0}%
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">Data Readiness</p>
                  <p className="text-muted-foreground text-xs">
                    {(status.capabilities_unlocked ?? []).length} capabilities unlocked
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="bg-border hidden h-10 w-px sm:block" />

              {/* Product Status Pills */}
              <div className="flex flex-wrap gap-2">
                <ProductStatusPill
                  label="Fabric"
                  status={
                    status.parcel_fabric.status as
                      | "active"
                      | "stale"
                      | "loading"
                      | "not_started"
                      | "error"
                  }
                  count={status.parcel_fabric.parcel_count}
                />
                <ProductStatusPill
                  label="Roll"
                  status={
                    status.county_roll.status as
                      | "active"
                      | "stale"
                      | "loading"
                      | "not_started"
                      | "error"
                  }
                  count={status.county_roll.total_records}
                />
                <ProductStatusPill
                  label="Sales"
                  status={
                    status.sales_stream.status as
                      | "active"
                      | "stale"
                      | "loading"
                      | "not_started"
                      | "error"
                  }
                  count={status.sales_stream.total_sales}
                />
              </div>

              {/* Divider */}
              <div className="bg-border hidden h-10 w-px sm:block" />

              {/* Last Activity */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">
                  Last update:{" "}
                  {status.last_updated ? new Date(status.last_updated).toLocaleString() : "—"}
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

          {/* Onboarding Tab */}
          <TabsContent value="onboarding">
            <OnboardingPanel
              countyFips={selectedCounty}
              onComplete={(fips) => {
                setSelectedCounty(fips);
                loadStatus();
                setActiveTab("inventory");
              }}
            />
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

// useSearchParams() requires a Suspense boundary for static prerendering (Next.js).
export default function DataSuitePage() {
  return (
    <Suspense
      fallback={<div className="text-muted-foreground p-8 text-sm">Loading data suite…</div>}
    >
      <DataSuitePageInner />
    </Suspense>
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
      status: status.parcel_fabric.status as
        | "active"
        | "stale"
        | "loading"
        | "not_started"
        | "error",
      count: status.parcel_fabric.parcel_count || 0,
      coverage: status.parcel_fabric.coverage_pct || 0,
      lastSync: status.parcel_fabric.last_sync || null,
      nextRefresh: status.parcel_fabric.next_refresh_at || null,
    },
    {
      type: "COUNTY_ROLL",
      name: "County Roll",
      icon: FileText,
      status: status.county_roll.status as "active" | "stale" | "loading" | "not_started" | "error",
      count: status.county_roll.total_records || 0,
      coverage: status.county_roll.join_rate_pct || 0,
      lastSync: status.county_roll.last_sync || null,
      nextRefresh: status.county_roll.next_refresh_at || null,
    },
    {
      type: "SALES_STREAM",
      name: "Sales Stream",
      icon: BarChart3,
      status: status.sales_stream.status as
        | "active"
        | "stale"
        | "loading"
        | "not_started"
        | "error",
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
                <span className="text-foreground font-medium">{product.coverage.toFixed(1)}%</span>
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
        <p className="text-muted-foreground mb-4 text-sm">
          Click any unlocked capability to go there.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { id: "cockpit_map", name: "Cockpit Map", icon: Map, href: "/cockpit" },
            { id: "ratio_studies", name: "Ratio Studies", icon: BarChart3, href: "/ratio-studies" },
            { id: "comps_selection", name: "Comps Selection", icon: Target, href: "/calibration" },
            { id: "model_calibration", name: "Model Calibration", icon: Zap, href: "/calibration" },
            { id: "appeals_support", name: "Appeals Support", icon: Scale, href: "/audit" },
          ].map((cap) => {
            const isUnlocked = (status.capabilities_unlocked ?? []).includes(cap.id);
            const Wrapper = isUnlocked ? "a" : "div";
            return (
              <Wrapper
                key={cap.id}
                {...(isUnlocked ? { href: cap.href } : {})}
                className={cn(
                  "flex items-center gap-2 rounded-lg p-3 text-sm transition-colors",
                  isUnlocked
                    ? "cursor-pointer bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                    : "bg-muted/20 text-muted-foreground cursor-not-allowed"
                )}
              >
                <cap.icon className="h-4 w-4" />
                <span className="font-medium">{cap.name}</span>
                {isUnlocked && <ChevronRight className="ml-auto h-4 w-4" />}
              </Wrapper>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Onboarding Panel - EMBEDDED county wizard
// ============================================

function OnboardingPanel({
  countyFips,
  onComplete,
}: {
  countyFips: WACountyFips | null;
  onComplete: (fips: WACountyFips) => void;
}) {
  return (
    <CountyOnboardingWizard
      onComplete={async (fips, path) => {
        // Route through DataSuiteHub
        if (path === "public_quickstart") {
          await dataSuiteHub.ingest({
            countyFips: fips,
            product: "PARCEL_FABRIC",
            source: "wa-fabric",
          });
        }
        onComplete(fips);
      }}
    />
  );
}

// ============================================
// Ingest Panel - EMBEDDED full ingest flow
// ============================================

type IngestStep = "upload" | "map" | "validate" | "preview" | "publish";

const ingestSteps: { id: IngestStep; label: string; description: string }[] = [
  { id: "upload", label: "Upload", description: "Select your data file" },
  { id: "map", label: "Map Fields", description: "Connect columns to schema" },
  { id: "validate", label: "Validate", description: "Check data quality" },
  { id: "preview", label: "Preview", description: "Review mapped data" },
  { id: "publish", label: "Publish", description: "Make it official" },
];

function IngestPanel({
  countyFips,
  onComplete,
}: {
  countyFips: WACountyFips | null;
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState<IngestStep>("upload");
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);

  const handleUploadComplete = useCallback((uploadedDataset: Dataset) => {
    setDataset(uploadedDataset);
    setCurrentStep("map");
  }, []);

  const handleMappingComplete = useCallback((mappings: FieldMapping[]) => {
    setFieldMappings(mappings);
    setCurrentStep("validate");
  }, []);

  const handleValidationComplete = useCallback((result: ValidationResult) => {
    setValidationResult(result);
    setCurrentStep("preview");
  }, []);

  const handlePreviewComplete = useCallback(() => {
    setCurrentStep("publish");
  }, []);

  const handlePublishComplete = useCallback(() => {
    // Reset for next upload and trigger refresh
    setDataset(null);
    setValidationResult(null);
    setFieldMappings([]);
    setCurrentStep("upload");
    onComplete();
  }, [onComplete]);

  const goBack = useCallback(() => {
    const stepIndex = ingestSteps.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(ingestSteps[stepIndex - 1].id);
    }
  }, [currentStep]);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <EnhancedIngestStepper steps={ingestSteps} currentStep={currentStep} />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === "upload" && <SmartUploadStep onComplete={handleUploadComplete} />}

        {currentStep === "map" && dataset && (
          <SmartMapFieldsStep
            dataset={dataset}
            onComplete={handleMappingComplete}
            onBack={goBack}
          />
        )}

        {currentStep === "validate" && dataset && (
          <ValidateStep dataset={dataset} onComplete={handleValidationComplete} onBack={goBack} />
        )}

        {currentStep === "preview" && dataset && (
          <PreviewStep
            dataset={dataset}
            fieldMappings={fieldMappings}
            onComplete={handlePreviewComplete}
            onBack={goBack}
          />
        )}

        {currentStep === "publish" && dataset && (
          <PublishStep dataset={dataset} onComplete={handlePublishComplete} onBack={goBack} />
        )}
      </div>
    </div>
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
          <p
            className={cn(
              "text-3xl font-bold",
              joinRate >= 95
                ? "text-emerald-400"
                : joinRate >= 85
                  ? "text-amber-400"
                  : "text-red-400"
            )}
          >
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
          <p
            className={cn(
              "text-3xl font-bold",
              armsLengthRate >= 80
                ? "text-emerald-400"
                : armsLengthRate >= 60
                  ? "text-amber-400"
                  : "text-red-400"
            )}
          >
            {armsLengthRate.toFixed(1)}%
          </p>
          <p className="text-muted-foreground mt-1 text-sm">Valid for ratio study inclusion</p>
        </Card>

        <Card className="tf-glass p-5">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="text-primary h-5 w-5" />
            <h4 className="text-foreground font-medium">Validation Pass</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-400">98.2%</p>
          <p className="text-muted-foreground mt-1 text-sm">Records passing all validation rules</p>
        </Card>
      </div>

      {/* Embedded Join Quality Dashboard */}
      <JoinQualityDashboard
        countyFips={countyFips}
        countyName={WA_COUNTIES[countyFips]?.name || status.county_name}
        onExportMismatches={() => {
          alert("Exporting mismatches CSV...");
        }}
      />
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
      approved_by?: string;
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

  // Map routing targets to actual routes
  const targetRouteMap: Record<string, string> = {
    Cockpit: "/cockpit",
    "Ratio Studies": "/ratio-studies",
    "Comps Engine": "/calibration",
    Calibration: "/calibration",
    Appeals: "/audit",
    Audit: "/audit",
    Reports: "/snapshots",
  };

  return (
    <div className="space-y-6">
      {/* Routing Map */}
      <Card className="tf-glass p-5">
        <h3 className="text-foreground mb-4 font-medium">Data Routing Map</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Click any destination to navigate there with your data ready.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {(["PARCEL_FABRIC", "COUNTY_ROLL", "SALES_STREAM"] as DataProductType[]).map(
            (product) => {
              const targets = DATA_PRODUCTS[product].routingTargets;
              return (
                <div key={product} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Database className="text-primary h-4 w-4" />
                    {DATA_PRODUCTS[product].displayName}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {targets.map((target) => {
                      const route = targetRouteMap[target];
                      if (route) {
                        return (
                          <a
                            key={target}
                            href={route}
                            className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-2 py-1 text-xs font-medium transition-colors"
                          >
                            {target} →
                          </a>
                        );
                      }
                      return (
                        <span
                          key={target}
                          className="bg-muted/30 text-muted-foreground rounded-full px-2 py-1 text-xs"
                        >
                          {target}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20">
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
      actor?: string;
      timestamp: string;
      details?: Record<string, unknown>;
    }>
  >([]);
  const [migrationReport, setMigrationReport] = useState<{
    totalCalls: number;
    uniqueFunctions: number;
    functions: Array<{ name: string; calls: number; lastCall: string | null }>;
    enforcementEnabled: boolean;
  } | null>(null);

  useEffect(() => {
    if (!countyFips) return;
    repository.getLineageEvents(countyFips, undefined, 20).then(setLineage);
  }, [countyFips]);

  // Load migration metrics (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    import("@/lib/api").then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMigrationReport(mod.getMigrationReport() as any);
    });
  }, []);

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
      {/* Migration Metrics (Dev Only) */}
      {migrationReport && process.env.NODE_ENV !== "production" && (
        <Card className="tf-glass border-amber-400/30 bg-amber-400/5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="font-medium text-amber-400">Legacy API Migration</h3>
            </div>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium",
                migrationReport.enforcementEnabled
                  ? "bg-red-400/20 text-red-400"
                  : "bg-amber-400/20 text-amber-400"
              )}
            >
              {migrationReport.enforcementEnabled ? "ENFORCING" : "WARNING"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Total Calls</p>
              <p className="text-foreground text-xl font-semibold">{migrationReport.totalCalls}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Unique Functions</p>
              <p className="text-foreground text-xl font-semibold">
                {migrationReport.uniqueFunctions}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Since Page Load</p>
              <p className="text-foreground font-mono text-sm">
                {migrationReport.functions
                  .slice(0, 3)
                  .map((f) => f.name)
                  .join(", ") || "None"}
              </p>
            </div>
          </div>
          {migrationReport.totalCalls > 0 && (
            <p className="text-muted-foreground mt-3 text-xs">
              Tip: Set ENFORCE_NO_LEGACY_API=true to block deprecated calls in CI
            </p>
          )}
        </Card>
      )}

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
                <span className="bg-muted/30 text-muted-foreground rounded px-2 py-1 font-mono text-xs">
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

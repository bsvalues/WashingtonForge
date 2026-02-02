"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Play,
  Loader2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getVEIFindings,
  getCalibrationLevers,
  getDatasetVersions,
  simulateCalibration,
  applyCalibration,
  type VEIFinding,
  type CalibrationLever,
  type CalibrationSimulation,
  type CalibrationLeverApply,
  type DatasetVersion,
  type DatasetMetrics,
  type VEIScope,
} from "@/lib/api";

// Severity badge colors
const severityColors = {
  fail: "bg-red-500/20 text-red-400 border-red-500/40",
  warn: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/40",
};

const severityIcons = {
  fail: AlertTriangle,
  warn: AlertCircle,
  info: Info,
};

// Format metric delta with trend indicator
function MetricDelta({
  before,
  after,
  label,
  format = "number",
  higherIsBetter = false,
}: {
  before: number;
  after: number;
  label: string;
  format?: "number" | "percent";
  higherIsBetter?: boolean;
}) {
  const delta = after - before;
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  const unchanged = Math.abs(delta) < 0.001;

  const formatValue = (v: number) =>
    format === "percent" ? `${(v * 100).toFixed(1)}%` : v.toFixed(3);
  const formatDelta = (d: number) => {
    const sign = d > 0 ? "+" : "";
    return format === "percent" ? `${sign}${(d * 100).toFixed(2)}%` : `${sign}${d.toFixed(3)}`;
  };

  return (
    <div className="border-border/30 flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground font-mono text-sm">{formatValue(before)}</span>
        <ArrowRight className="text-muted-foreground h-3 w-3" />
        <span className="font-mono text-sm font-medium">{formatValue(after)}</span>
        <span
          className={cn(
            "flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs",
            unchanged && "bg-muted/50 text-muted-foreground",
            !unchanged && improved && "bg-green-500/20 text-green-400",
            !unchanged && !improved && "bg-red-500/20 text-red-400"
          )}
        >
          {unchanged ? (
            <>
              <Minus className="h-3 w-3" /> 0
            </>
          ) : improved ? (
            <>
              <TrendingDown className="h-3 w-3" /> {formatDelta(delta)}
            </>
          ) : (
            <>
              <TrendingUp className="h-3 w-3" /> {formatDelta(delta)}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

export function CalibrationContent() {
  const [findings, setFindings] = useState<VEIFinding[]>([]);
  const [levers, setLevers] = useState<CalibrationLever[]>([]);
  const [leverValues, setLeverValues] = useState<Record<string, number>>({});
  const [versions, setVersions] = useState<DatasetVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DatasetVersion | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<VEIFinding | null>(null);
  const [simulation, setSimulation] = useState<CalibrationSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [findingsData, leversData, versionsData] = await Promise.all([
        getVEIFindings(),
        getCalibrationLevers(),
        getDatasetVersions(),
      ]);
      setFindings(findingsData);
      setLevers(leversData);
      setVersions(versionsData);

      // Initialize lever values
      const initialValues: Record<string, number> = {};
      leversData.forEach((l) => {
        initialValues[l.type] = l.currentValue;
      });
      setLeverValues(initialValues);

      // Select first version
      if (versionsData.length > 0) {
        setSelectedVersion(versionsData[0]);
      }
    }
    loadData();
  }, []);

  // Reset lever values
  const handleReset = () => {
    const initialValues: Record<string, number> = {};
    levers.forEach((l) => {
      initialValues[l.type] = l.currentValue;
    });
    setLeverValues(initialValues);
    setSimulation(null);
    setApplied(false);
  };

  // Simulate calibration
  const handleSimulate = async () => {
    if (!selectedVersion) return;

    setIsSimulating(true);
    try {
      const leverApplies: CalibrationLeverApply[] = levers
        .filter((l) => leverValues[l.type] !== l.currentValue)
        .map((l) => ({
          type: l.type,
          value: leverValues[l.type],
          delta: leverValues[l.type] - l.currentValue,
        }));

      const scope: VEIScope = selectedFinding?.scope || "overall";
      const scopeId = selectedFinding?.scopeId;

      const result = await simulateCalibration({
        datasetVersionId: selectedVersion.id,
        scope,
        scopeId,
        levers: leverApplies,
      });
      setSimulation(result);
    } finally {
      setIsSimulating(false);
    }
  };

  // Apply calibration
  const handleApply = async () => {
    if (!selectedVersion || !simulation) return;

    setIsApplying(true);
    try {
      const scope: VEIScope = selectedFinding?.scope || "overall";
      const scopeId = selectedFinding?.scopeId;

      await applyCalibration({
        datasetVersionId: selectedVersion.id,
        scope,
        scopeId,
        levers: simulation.levers,
      });
      setApplied(true);
    } finally {
      setIsApplying(false);
    }
  };

  // Count findings by severity
  const findingCounts = {
    fail: findings.filter((f) => f.severity === "fail").length,
    warn: findings.filter((f) => f.severity === "warn").length,
    info: findings.filter((f) => f.severity === "info").length,
  };

  return (
    <div className="space-bg min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">Unified Valuation Loop</h1>
            <p className="text-muted-foreground mt-1">
              VEI Diagnosis + Benton Calibration + Before/After Comparison
            </p>
          </div>

          {/* Dataset Version Selector */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Dataset:</span>
            <select
              value={selectedVersion?.id || ""}
              onChange={(e) => {
                const v = versions.find((v) => v.id === e.target.value);
                setSelectedVersion(v || null);
                setSimulation(null);
                setApplied(false);
              }}
              className="tf-glass border-border/50 focus:ring-primary/50 rounded-lg bg-transparent px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  Roll {v.rollYear} v{v.version} ({v.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Bar */}
        <Card className="tf-glass p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    findingCounts.fail > 0 ? "bg-red-500" : "bg-muted"
                  )}
                />
                <span className="text-sm">
                  <span className="font-medium">{findingCounts.fail}</span>
                  <span className="text-muted-foreground ml-1">Critical</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    findingCounts.warn > 0 ? "bg-amber-500" : "bg-muted"
                  )}
                />
                <span className="text-sm">
                  <span className="font-medium">{findingCounts.warn}</span>
                  <span className="text-muted-foreground ml-1">Warning</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full bg-blue-500")} />
                <span className="text-sm">
                  <span className="font-medium">{findingCounts.info}</span>
                  <span className="text-muted-foreground ml-1">Info</span>
                </span>
              </div>
            </div>

            {selectedVersion?.metrics && (
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Median Ratio:</span>
                  <span className="ml-2 font-mono">
                    {selectedVersion.metrics.medianRatio.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">COD:</span>
                  <span className="ml-2 font-mono">{selectedVersion.metrics.cod.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">PRD:</span>
                  <span className="ml-2 font-mono">{selectedVersion.metrics.prd.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">PRB:</span>
                  <span className="ml-2 font-mono">{selectedVersion.metrics.prb.toFixed(3)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Three-Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: VEI Findings */}
          <Card className="tf-glass p-4">
            <h2 className="mb-4 text-lg font-medium">VEI Findings</h2>
            <div className="space-y-3">
              {findings.map((finding) => {
                const Icon = severityIcons[finding.severity];
                const isSelected = selectedFinding?.id === finding.id;

                return (
                  <button
                    key={finding.id}
                    onClick={() => setSelectedFinding(isSelected ? null : finding)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-all",
                      severityColors[finding.severity],
                      isSelected && "ring-primary ring-2"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-medium uppercase opacity-75">
                            {finding.scope}
                          </span>
                          {finding.scopeId && (
                            <span className="text-xs opacity-75">: {finding.scopeId}</span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm">{finding.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs opacity-75">
                          <span>
                            {finding.metric}: {finding.currentValue.toFixed(3)}
                          </span>
                          <span className="opacity-50">|</span>
                          <span>
                            Target: {finding.direction === "above" ? "<" : ">"} {finding.threshold}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Middle: Calibration Levers */}
          <Card className="tf-glass p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Calibration Levers</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset
              </Button>
            </div>

            {/* Recommended Levers */}
            {selectedFinding && selectedFinding.recommendedLevers.length > 0 && (
              <div className="bg-primary/10 border-primary/30 mb-4 rounded-lg border p-3">
                <p className="text-primary mb-2 text-xs font-medium">
                  Recommended for selected finding:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedFinding.recommendedLevers.map((lever) => (
                    <span
                      key={lever}
                      className="bg-primary/20 text-primary rounded px-2 py-0.5 text-xs"
                    >
                      {levers.find((l) => l.type === lever)?.label || lever}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {levers.map((lever) => {
                const isRecommended = selectedFinding?.recommendedLevers.includes(lever.type);
                const hasChanged = leverValues[lever.type] !== lever.currentValue;

                return (
                  <div
                    key={lever.type}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      isRecommended && "border-primary/50 bg-primary/5",
                      hasChanged && "border-accent/50 bg-accent/5",
                      !isRecommended && !hasChanged && "border-border/30"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {lever.label}
                        {isRecommended && (
                          <span className="text-primary ml-2 text-xs">(recommended)</span>
                        )}
                      </label>
                      <span className="font-mono text-sm">
                        {leverValues[lever.type]?.toFixed(2)} {lever.unit}
                      </span>
                    </div>
                    <Slider
                      value={[leverValues[lever.type] || lever.currentValue]}
                      min={lever.minValue}
                      max={lever.maxValue}
                      step={lever.step}
                      onValueChange={(value) => {
                        setLeverValues((prev) => ({ ...prev, [lever.type]: value[0] }));
                        setSimulation(null);
                        setApplied(false);
                      }}
                      className="w-full"
                    />
                    <p className="text-muted-foreground mt-2 text-xs">{lever.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Simulate Button */}
            <Button
              onClick={handleSimulate}
              disabled={isSimulating || !selectedVersion}
              className="tf-glass-btn tf-glass-btn--primary mt-6 w-full"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Simulate Changes
                </>
              )}
            </Button>
          </Card>

          {/* Right: Before/After Comparison */}
          <Card className="tf-glass p-4">
            <h2 className="mb-4 text-lg font-medium">Before / After</h2>

            {!simulation ? (
              <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
                <Info className="mb-3 h-8 w-8 opacity-50" />
                <p className="text-center text-sm">
                  Adjust calibration levers and click
                  <br />
                  "Simulate Changes" to see the impact.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scope Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs uppercase">Scope:</span>
                  <span className="bg-secondary/50 rounded px-2 py-0.5 text-sm">
                    {simulation.scope}
                    {simulation.scopeId && `: ${simulation.scopeId}`}
                  </span>
                </div>

                {/* Metrics Comparison */}
                <div className="border-border/30 rounded-lg border p-3">
                  <MetricDelta
                    before={simulation.beforeMetrics.medianRatio}
                    after={simulation.afterMetrics.medianRatio}
                    label="Median Ratio"
                  />
                  <MetricDelta
                    before={simulation.beforeMetrics.cod}
                    after={simulation.afterMetrics.cod}
                    label="COD"
                  />
                  <MetricDelta
                    before={simulation.beforeMetrics.prd}
                    after={simulation.afterMetrics.prd}
                    label="PRD"
                  />
                  <MetricDelta
                    before={simulation.beforeMetrics.prb}
                    after={simulation.afterMetrics.prb}
                    label="PRB"
                  />
                </div>

                {/* Improvement Badge */}
                <div
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg p-3",
                    simulation.improvement
                      ? "border border-green-500/40 bg-green-500/20"
                      : "border border-amber-500/40 bg-amber-500/20"
                  )}
                >
                  {simulation.improvement ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="font-medium text-green-400">Metrics Improved</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                      <span className="font-medium text-amber-400">Review Changes</span>
                    </>
                  )}
                </div>

                {/* Applied Levers */}
                <div>
                  <h3 className="mb-2 text-sm font-medium">Applied Levers:</h3>
                  <div className="space-y-1">
                    {simulation.levers.map((lever) => (
                      <div key={lever.type} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {levers.find((l) => l.type === lever.type)?.label || lever.type}
                        </span>
                        <span className="font-mono">
                          {lever.delta > 0 ? "+" : ""}
                          {lever.delta.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                {applied ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500/40 bg-green-500/20 p-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="font-medium text-green-400">
                      Calibration Applied - New Version Created
                    </span>
                  </div>
                ) : (
                  <Button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="tf-glass-btn tf-glass-btn--primary w-full"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Apply & Create New Version
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

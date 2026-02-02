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
function MetricDelta({ before, after, label, format = "number", higherIsBetter = false }: {
  before: number;
  after: number;
  label: string;
  format?: "number" | "percent";
  higherIsBetter?: boolean;
}) {
  const delta = after - before;
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  const unchanged = Math.abs(delta) < 0.001;
  
  const formatValue = (v: number) => format === "percent" ? `${(v * 100).toFixed(1)}%` : v.toFixed(3);
  const formatDelta = (d: number) => {
    const sign = d > 0 ? "+" : "";
    return format === "percent" ? `${sign}${(d * 100).toFixed(2)}%` : `${sign}${d.toFixed(3)}`;
  };
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-muted-foreground">{formatValue(before)}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-sm font-mono font-medium">{formatValue(after)}</span>
        <span className={cn(
          "text-xs font-mono px-1.5 py-0.5 rounded flex items-center gap-1",
          unchanged && "bg-muted/50 text-muted-foreground",
          !unchanged && improved && "bg-green-500/20 text-green-400",
          !unchanged && !improved && "bg-red-500/20 text-red-400"
        )}>
          {unchanged ? (
            <><Minus className="w-3 h-3" /> 0</>
          ) : improved ? (
            <><TrendingDown className="w-3 h-3" /> {formatDelta(delta)}</>
          ) : (
            <><TrendingUp className="w-3 h-3" /> {formatDelta(delta)}</>
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Unified Valuation Loop
            </h1>
            <p className="text-muted-foreground mt-1">
              VEI Diagnosis + Benton Calibration + Before/After Comparison
            </p>
          </div>
          
          {/* Dataset Version Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Dataset:</span>
            <select
              value={selectedVersion?.id || ""}
              onChange={(e) => {
                const v = versions.find((v) => v.id === e.target.value);
                setSelectedVersion(v || null);
                setSimulation(null);
                setApplied(false);
              }}
              className="glass-panel px-3 py-2 rounded-lg text-sm bg-transparent border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
        <Card className="glass-panel p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full", findingCounts.fail > 0 ? "bg-red-500" : "bg-muted")} />
                <span className="text-sm">
                  <span className="font-medium">{findingCounts.fail}</span>
                  <span className="text-muted-foreground ml-1">Critical</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full", findingCounts.warn > 0 ? "bg-amber-500" : "bg-muted")} />
                <span className="text-sm">
                  <span className="font-medium">{findingCounts.warn}</span>
                  <span className="text-muted-foreground ml-1">Warning</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full bg-blue-500")} />
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
                  <span className="ml-2 font-mono">{selectedVersion.metrics.medianRatio.toFixed(3)}</span>
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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: VEI Findings */}
          <Card className="glass-panel p-4">
            <h2 className="text-lg font-medium mb-4">VEI Findings</h2>
            <div className="space-y-3">
              {findings.map((finding) => {
                const Icon = severityIcons[finding.severity];
                const isSelected = selectedFinding?.id === finding.id;
                
                return (
                  <button
                    key={finding.id}
                    onClick={() => setSelectedFinding(isSelected ? null : finding)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      severityColors[finding.severity],
                      isSelected && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase font-medium opacity-75">
                            {finding.scope}
                          </span>
                          {finding.scopeId && (
                            <span className="text-xs opacity-75">: {finding.scopeId}</span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-2">{finding.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                          <span>{finding.metric}: {finding.currentValue.toFixed(3)}</span>
                          <span className="opacity-50">|</span>
                          <span>Target: {finding.direction === "above" ? "<" : ">"} {finding.threshold}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Middle: Calibration Levers */}
          <Card className="glass-panel p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Calibration Levers</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
            
            {/* Recommended Levers */}
            {selectedFinding && selectedFinding.recommendedLevers.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-primary mb-2 font-medium">Recommended for selected finding:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedFinding.recommendedLevers.map((lever) => (
                    <span key={lever} className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
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
                      "p-3 rounded-lg border transition-all",
                      isRecommended && "border-primary/50 bg-primary/5",
                      hasChanged && "border-accent/50 bg-accent/5",
                      !isRecommended && !hasChanged && "border-border/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">
                        {lever.label}
                        {isRecommended && <span className="ml-2 text-xs text-primary">(recommended)</span>}
                      </label>
                      <span className="text-sm font-mono">
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
                    <p className="text-xs text-muted-foreground mt-2">{lever.description}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Simulate Button */}
            <Button
              onClick={handleSimulate}
              disabled={isSimulating || !selectedVersion}
              className="w-full mt-6 glass-btn-primary"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Simulate Changes
                </>
              )}
            </Button>
          </Card>

          {/* Right: Before/After Comparison */}
          <Card className="glass-panel p-4">
            <h2 className="text-lg font-medium mb-4">Before / After</h2>
            
            {!simulation ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Info className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm text-center">
                  Adjust calibration levers and click
                  <br />
                  "Simulate Changes" to see the impact.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scope Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase text-muted-foreground">Scope:</span>
                  <span className="text-sm px-2 py-0.5 rounded bg-secondary/50">
                    {simulation.scope}
                    {simulation.scopeId && `: ${simulation.scopeId}`}
                  </span>
                </div>
                
                {/* Metrics Comparison */}
                <div className="border border-border/30 rounded-lg p-3">
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
                <div className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg",
                  simulation.improvement
                    ? "bg-green-500/20 border border-green-500/40"
                    : "bg-amber-500/20 border border-amber-500/40"
                )}>
                  {simulation.improvement ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-green-400">Metrics Improved</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <span className="font-medium text-amber-400">Review Changes</span>
                    </>
                  )}
                </div>
                
                {/* Applied Levers */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Applied Levers:</h3>
                  <div className="space-y-1">
                    {simulation.levers.map((lever) => (
                      <div key={lever.type} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {levers.find((l) => l.type === lever.type)?.label || lever.type}
                        </span>
                        <span className="font-mono">
                          {lever.delta > 0 ? "+" : ""}{lever.delta.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Apply Button */}
                {applied ? (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/20 border border-green-500/40">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-green-400">
                      Calibration Applied - New Version Created
                    </span>
                  </div>
                ) : (
                  <Button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full glass-btn-primary"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
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

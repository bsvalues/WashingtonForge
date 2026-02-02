// TerraFusion IAAO Compliance Engine
// Computes compliance status from metrics against configurable thresholds

import type {
  IAAOComplianceThresholds,
  ComplianceStatus,
  ComplianceResult,
  RatioStudyResults,
  DatasetMetrics,
} from "@/lib/api/types";
import { IAAO_RESIDENTIAL_THRESHOLDS, IAAO_COMMERCIAL_THRESHOLDS } from "@/lib/api/types";

// ============================================
// Compliance Computation
// ============================================

export function computeComplianceStatus(
  value: number,
  min: number,
  max: number,
  warningBuffer = 0.1 // 10% buffer for warning zone
): ComplianceStatus {
  if (value >= min && value <= max) {
    return "compliant";
  }

  const range = max - min;
  const warningMin = min - range * warningBuffer;
  const warningMax = max + range * warningBuffer;

  if (value >= warningMin && value <= warningMax) {
    return "warning";
  }

  return "non-compliant";
}

export function computeCODCompliance(
  cod: number,
  maxThreshold: number
): ComplianceStatus {
  if (cod <= maxThreshold) {
    return "compliant";
  }
  if (cod <= maxThreshold * 1.15) {
    return "warning";
  }
  return "non-compliant";
}

export function evaluateCompliance(
  metrics: { medianRatio: number; cod: number; prd: number; prb: number },
  thresholds: IAAOComplianceThresholds = IAAO_RESIDENTIAL_THRESHOLDS
): ComplianceResult {
  const details: string[] = [];

  // Ratio compliance
  const ratioStatus = computeComplianceStatus(
    metrics.medianRatio,
    thresholds.ratioMin,
    thresholds.ratioMax
  );
  if (ratioStatus !== "compliant") {
    details.push(
      `Median ratio ${metrics.medianRatio.toFixed(3)} outside target range ${thresholds.ratioMin}-${thresholds.ratioMax}`
    );
  }

  // COD compliance
  const codStatus = computeCODCompliance(metrics.cod, thresholds.codMax);
  if (codStatus !== "compliant") {
    details.push(
      `COD ${metrics.cod.toFixed(1)}% exceeds maximum ${thresholds.codMax}%`
    );
  }

  // PRD compliance
  const prdStatus = computeComplianceStatus(
    metrics.prd,
    thresholds.prdMin,
    thresholds.prdMax
  );
  if (prdStatus !== "compliant") {
    const direction = metrics.prd > 1 ? "regressive" : "progressive";
    details.push(
      `PRD ${metrics.prd.toFixed(3)} indicates ${direction} assessment (target: ${thresholds.prdMin}-${thresholds.prdMax})`
    );
  }

  // PRB compliance
  const prbStatus = computeComplianceStatus(
    metrics.prb,
    thresholds.prbMin,
    thresholds.prbMax
  );
  if (prbStatus !== "compliant") {
    const direction = metrics.prb > 0 ? "regressive" : "progressive";
    details.push(
      `PRB ${metrics.prb.toFixed(3)} indicates ${direction} bias (target: ${thresholds.prbMin}-${thresholds.prbMax})`
    );
  }

  // Overall status (worst of all)
  const statuses = [ratioStatus, codStatus, prdStatus, prbStatus];
  let overall: ComplianceStatus = "compliant";
  if (statuses.includes("non-compliant")) {
    overall = "non-compliant";
  } else if (statuses.includes("warning")) {
    overall = "warning";
  }

  if (overall === "compliant") {
    details.push("All IAAO standards met");
  }

  return {
    overall,
    ratio: ratioStatus,
    cod: codStatus,
    prd: prdStatus,
    prb: prbStatus,
    details,
  };
}

// ============================================
// Compliance from Ratio Study Results
// ============================================

export function evaluateRatioStudyCompliance(
  results: RatioStudyResults,
  propertyType: "residential" | "commercial" = "residential"
): ComplianceResult {
  const thresholds =
    propertyType === "commercial"
      ? IAAO_COMMERCIAL_THRESHOLDS
      : IAAO_RESIDENTIAL_THRESHOLDS;

  return evaluateCompliance(
    {
      medianRatio: results.medianRatio,
      cod: results.cod,
      prd: results.prd,
      prb: results.prb,
    },
    thresholds
  );
}

// ============================================
// Compliance from Dataset Metrics
// ============================================

export function evaluateDatasetCompliance(
  metrics: DatasetMetrics,
  propertyType: "residential" | "commercial" = "residential"
): ComplianceResult {
  const thresholds =
    propertyType === "commercial"
      ? IAAO_COMMERCIAL_THRESHOLDS
      : IAAO_RESIDENTIAL_THRESHOLDS;

  return evaluateCompliance(
    {
      medianRatio: metrics.medianRatio,
      cod: metrics.cod,
      prd: metrics.prd,
      prb: metrics.prb,
    },
    thresholds
  );
}

// ============================================
// Compliance Badge Text
// ============================================

export function getComplianceLabel(status: ComplianceStatus): string {
  switch (status) {
    case "compliant":
      return "IAAO Compliant";
    case "warning":
      return "Review Needed";
    case "non-compliant":
      return "Non-Compliant";
  }
}

export function getComplianceColor(status: ComplianceStatus): string {
  switch (status) {
    case "compliant":
      return "text-equity-fair";
    case "warning":
      return "text-yellow-400";
    case "non-compliant":
      return "text-equity-regressive";
  }
}

export function getComplianceBgColor(status: ComplianceStatus): string {
  switch (status) {
    case "compliant":
      return "bg-equity-fair/20 border-equity-fair/40";
    case "warning":
      return "bg-yellow-400/20 border-yellow-400/40";
    case "non-compliant":
      return "bg-equity-regressive/20 border-equity-regressive/40";
  }
}

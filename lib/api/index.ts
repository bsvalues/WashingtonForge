/**
 * @deprecated ARCHITECTURAL BOUNDARY - COMPATIBILITY SHIM
 * 
 * This module exists ONLY for backwards compatibility during migration.
 * 
 * DO NOT import from here in new code.
 * All data operations MUST go through the DataSuiteHub:
 * 
 *   import { dataSuiteHub } from "@/lib/data-suite";
 *   await dataSuiteHub.ingest({ ... });
 * 
 * This shim:
 * 1. Warns once per function (dev only)
 * 2. Forwards to DataSuiteHub (not api-internal)
 * 3. Preserves types for compile compatibility
 */

import { dataSuiteHub } from "@/lib/data-suite/hub";
import type { DatasetType } from "@/lib/api-internal/types";

// ============================================
// warnOnce utility - prevents console spam
// ============================================

const warned = new Set<string>();
const callCounts = new Map<string, number>();

function warnOnce(fnName: string, replacement: string) {
  // Track call count for migration metrics
  callCounts.set(fnName, (callCounts.get(fnName) || 0) + 1);
  
  // Only warn in development, and only once per function
  if (process.env.NODE_ENV === "production") return;
  if (warned.has(fnName)) return;
  
  warned.add(fnName);
  console.warn(
    `[DEPRECATED] @/lib/api → "${fnName}" is deprecated.\n` +
    `  Use: ${replacement}\n` +
    `  Import: import { dataSuiteHub } from "@/lib/data-suite";`
  );
}

/** Get migration metrics (for audit/telemetry) */
export function getDeprecatedCallCounts(): Record<string, number> {
  return Object.fromEntries(callCounts);
}

// ============================================
// TYPE EXPORTS (safe, no deprecation)
// ============================================

export type {
  Dataset,
  DatasetType,
  DatasetStatus,
  FieldMapping,
  ValidationResult,
  ValidationError,
  RatioStudy,
  RatioStudyResult,
  EquityMetrics,
  Snapshot,
  AuditLogEntry,
  DataSource,
} from "@/lib/api-internal/types";

// Re-export all types from internal module
export * from "@/lib/api-internal/types";

// ============================================
// DEPRECATED FUNCTION EXPORTS → Forward to Hub
// ============================================

/**
 * @deprecated Use dataSuiteHub.ingest() instead
 */
export async function uploadDataset(
  file: File,
  datasetType: DatasetType
) {
  warnOnce("uploadDataset", "dataSuiteHub.ingest({ file, product })");
  
  // Map old DatasetType to new DataProductType
  const productMap: Record<DatasetType, "PARCEL_FABRIC" | "SALES_STREAM" | "BUILDINGS" | "COUNTY_ROLL"> = {
    parcel: "PARCEL_FABRIC",
    sales: "SALES_STREAM",
    building: "BUILDINGS",
    assessment: "COUNTY_ROLL",
    bulk_package: "COUNTY_ROLL",
    geodatabase: "PARCEL_FABRIC",
  };

  const ingestRun = await dataSuiteHub.ingest({
    countyFips: "53005", // Default county - should come from context
    product: productMap[datasetType],
    source: "file",
    file,
  });

  // Convert IngestRun to old Dataset format for backwards compat
  return {
    id: ingestRun.id,
    name: file.name,
    type: datasetType,
    status: ingestRun.status === "ready" ? "ready" : "validating",
    rowCount: ingestRun.row_counts_by_stage?.raw || 0,
    errorCount: 0,
    createdAt: ingestRun.started_at,
  };
}

/**
 * @deprecated Use dataSuiteHub.validate() instead
 */
export async function validateDataset(datasetId: string) {
  warnOnce("validateDataset", "dataSuiteHub.validate(datasetId)");
  return dataSuiteHub.validate(datasetId);
}

/**
 * @deprecated Use dataSuiteHub.publish() instead
 */
export async function publishDataset(datasetId: string) {
  warnOnce("publishDataset", "dataSuiteHub.publish(datasetId)");
  return dataSuiteHub.publish(datasetId);
}

/**
 * @deprecated Use dataSuiteHub.getStatus() instead
 */
export async function getIngestStatus(runId: string) {
  warnOnce("getIngestStatus", "dataSuiteHub.getStatus(runId)");
  // Forward to hub's status method
  const status = await dataSuiteHub.getStatus(runId as `53${string}`);
  return status;
}

// ============================================
// READ-ONLY OPERATIONS (safe to use directly)
// These don't mutate data, so hub routing is optional
// ============================================

export {
  // Dataset queries
  getDatasets,
  getParcels,
  getParcelById,
  getSourceFields,
  previewDataset,
  getDatasetErrors,
  getFieldMappings,
  // Ratio studies
  getRatioStudies,
  runRatioStudy,
  // Snapshots
  getSnapshots,
  createSnapshot,
  // Audit
  getAuditLog,
  // Data sources
  getDataSources,
  // Auth (until migrated)
  login,
  logout,
  getCurrentUser,
} from "@/lib/api-internal/demo-client";

// ============================================
// DEMO MODE FLAG
// ============================================

export { DEMO_MODE } from "@/lib/api-internal/index";

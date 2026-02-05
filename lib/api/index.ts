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
 * 2. Can throw in CI/dev when ENFORCE_NO_LEGACY_API=true
 * 3. Forwards mutators to DataSuiteHub (sovereign model)
 * 4. Preserves types for compile compatibility
 * 
 * For read-only queries, prefer: import { ... } from "@/lib/api/query"
 */

import { dataSuiteHub } from "@/lib/data-suite/hub";
import type { DatasetType } from "@/lib/api-internal/types";

// ============================================
// KILL SWITCH - flip to "throw" when migration is complete
// ============================================

const ENFORCE_NO_LEGACY = process.env.ENFORCE_NO_LEGACY_API === "true";

// ============================================
// warnOnce utility - prevents console spam
// ============================================

const warned = new Set<string>();
const callCounts = new Map<string, number>();
const lastCallTimes = new Map<string, number>();

function warnOnce(fnName: string, replacement: string) {
  // Track call count and time for migration metrics
  callCounts.set(fnName, (callCounts.get(fnName) || 0) + 1);
  lastCallTimes.set(fnName, Date.now());
  
  // Kill switch: throw in CI/dev when enforcement is enabled
  if (ENFORCE_NO_LEGACY) {
    throw new Error(
      `[LEGACY_API_BLOCKED] "${fnName}" is blocked.\n` +
      `Use: ${replacement}\n` +
      `Set ENFORCE_NO_LEGACY_API=false to allow deprecated calls.`
    );
  }
  
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

// ============================================
// MIGRATION METRICS API
// ============================================

/** Get migration metrics (for audit/telemetry) */
export function getDeprecatedCallCounts(): Record<string, number> {
  return Object.fromEntries(callCounts);
}

/** Get last call times for each deprecated function */
export function getDeprecatedLastCalls(): Record<string, number> {
  return Object.fromEntries(lastCallTimes);
}

/** Reset counters (for deterministic tests) */
export function resetDeprecatedCallCounts(): void {
  callCounts.clear();
  lastCallTimes.clear();
  warned.clear();
}

/** Get full migration report */
export function getMigrationReport() {
  const counts = getDeprecatedCallCounts();
  const lastCalls = getDeprecatedLastCalls();
  
  return {
    totalCalls: Object.values(counts).reduce((a, b) => a + b, 0),
    uniqueFunctions: Object.keys(counts).length,
    functions: Object.keys(counts).map(fn => ({
      name: fn,
      calls: counts[fn],
      lastCall: lastCalls[fn] ? new Date(lastCalls[fn]).toISOString() : null,
    })),
    enforcementEnabled: ENFORCE_NO_LEGACY,
  };
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
// DEPRECATED MUTATORS → Forward to Hub
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
  const status = await dataSuiteHub.getStatus(runId as `53${string}`);
  return status;
}

// ============================================
// READ-ONLY PASSTHROUGHS
// For explicit intent, prefer: import from "@/lib/api/query"
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

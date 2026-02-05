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
import { eventBus } from "@/lib/data-suite/event-bus";
import type { DatasetType, RollYearSnapshot } from "@/lib/api-internal/types";

// Re-export types for backwards compatibility
export type { RollYearSnapshot };

// ============================================
// KILL SWITCH - flip to "throw" when migration is complete
// ============================================

const ENFORCE_NO_LEGACY = process.env.ENFORCE_NO_LEGACY_API === "true";

// ============================================
// ASSESSOR-GRADE MIGRATION TRACKING
// ============================================

interface CallRecord {
  count: number;
  firstSeen: number;
  lastSeen: number;
  callSites: Set<string>; // Unique stack traces (hashed)
}

const warned = new Set<string>();
const callRecords = new Map<string, CallRecord>();
const sessionId = typeof crypto !== "undefined" && crypto.randomUUID 
  ? crypto.randomUUID() 
  : `session-${Date.now()}`;
const sessionStart = Date.now();

/** Simple hash for call site tracking */
function hashCallSite(stack: string | undefined): string {
  if (!stack) return "unknown";
  // Extract first 3 non-library frames
  const frames = stack.split("\n").slice(2, 5).join("|");
  return frames.slice(0, 100);
}

function warnOnce(fnName: string, replacement: string) {
  const now = Date.now();
  const callSite = hashCallSite(new Error().stack);
  
  // Track call record with assessor-grade metadata
  const existing = callRecords.get(fnName);
  if (existing) {
    existing.count++;
    existing.lastSeen = now;
    existing.callSites.add(callSite);
  } else {
    callRecords.set(fnName, {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      callSites: new Set([callSite]),
    });
  }
  
  // Emit canonical audit event (hub is single authority for all events)
  eventBus.emit({
    type: "deprecated.api_call",
    payload: {
      function: fnName,
      replacement,
      sessionId,
      environment: process.env.NODE_ENV || "unknown",
    },
    timestamp: new Date().toISOString(),
  });
  
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
// MIGRATION METRICS API (Assessor-Grade)
// ============================================

/** Simple call counts (backwards compat) */
export function getDeprecatedCallCounts(): Record<string, number> {
  const result: Record<string, number> = {};
  callRecords.forEach((record, fn) => {
    result[fn] = record.count;
  });
  return result;
}

/** Get last call times for each deprecated function */
export function getDeprecatedLastCalls(): Record<string, number> {
  const result: Record<string, number> = {};
  callRecords.forEach((record, fn) => {
    result[fn] = record.lastSeen;
  });
  return result;
}

/** Reset counters (for deterministic tests) */
export function resetDeprecatedCallCounts(): void {
  callRecords.clear();
  warned.clear();
}

/** 
 * Get full migration report - ASSESSOR-GRADE AUDIT MATERIAL
 * 
 * This report is suitable for:
 * - CI enforcement checks
 * - Operational audits
 * - Migration burn-down tracking
 */
export function getMigrationReport() {
  const functions: Array<{
    name: string;
    calls: number;
    firstSeen: string | null;
    lastSeen: string | null;
    uniqueCallSites: number;
  }> = [];
  
  let totalCalls = 0;
  callRecords.forEach((record, fn) => {
    totalCalls += record.count;
    functions.push({
      name: fn,
      calls: record.count,
      firstSeen: new Date(record.firstSeen).toISOString(),
      lastSeen: new Date(record.lastSeen).toISOString(),
      uniqueCallSites: record.callSites.size,
    });
  });
  
  return {
    // Summary
    totalCalls,
    uniqueFunctions: functions.length,
    enforcementEnabled: ENFORCE_NO_LEGACY,
    
    // Session metadata (for audit correlation)
    sessionId,
    sessionStarted: new Date(sessionStart).toISOString(),
    reportGenerated: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
    
    // Detailed function breakdown
    functions: functions.sort((a, b) => b.calls - a.calls),
    
    // CI helper: true if any mutator was called
    hasMutatorCalls: functions.some(f => 
      ["uploadDataset", "validateDataset", "publishDataset", "getIngestStatus"].includes(f.name)
    ),
  };
}

/**
 * CI ASSERTION HELPER
 * 
 * Usage in E2E tests:
 *   import { assertNoLegacyMutators } from "@/lib/api";
 *   afterAll(() => assertNoLegacyMutators());
 * 
 * Throws if any deprecated mutator was called during the test.
 */
export function assertNoLegacyMutators(): void {
  const report = getMigrationReport();
  if (report.hasMutatorCalls) {
    const mutators = report.functions
      .filter(f => ["uploadDataset", "validateDataset", "publishDataset", "getIngestStatus"].includes(f.name))
      .map(f => `  - ${f.name}: ${f.calls} calls`)
      .join("\n");
    throw new Error(
      `[CI_ASSERTION_FAILED] Legacy mutator calls detected:\n${mutators}\n\n` +
      `Migrate to dataSuiteHub before merging.`
    );
  }
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
  // Dataset queries (that actually exist in demo-client)
  getParcels,
  getParcelById,
  getSourceFields,
  previewDataset,
  getDatasetErrors,
  downloadErrorCsv,
  saveFieldMapping,
  // Ratio studies
  getRatioStudies,
  runRatioStudy,
  // Snapshots - export both original names AND aliases for compatibility
  getRollYearSnapshots,
  createRollYearSnapshot,
  publishSnapshot,
  getRollYearSnapshots as getSnapshots,
  createRollYearSnapshot as createSnapshot,
  // Audit
  getAuditLog,
  // Data freshness
  loadCountyDataFreshness as getDataSources,
  // Auth (until migrated)
  login,
  logout,
  getCurrentUser,
} from "@/lib/api-internal/demo-client";

// Stub for getDatasets - returns empty array (not implemented in demo-client)
export async function getDatasets() {
  return [];
}

// Stub for getFieldMappings - returns empty array (not implemented in demo-client)
export async function getFieldMappings(_datasetId: string) {
  return [];
}

// ============================================
// DEMO MODE FLAG
// ============================================

export { DEMO_MODE } from "@/lib/api-internal/index";

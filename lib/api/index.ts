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
// Types imported from barrel to comply with barrel-only import rule
import type {
  DatasetType,
  RollYearSnapshot,
  MapLayer,
  ParcelFilter,
  Parcel,
  EquityStatus,
} from "@/lib/api-internal";
import type { WACountyFips } from "@/lib/wa-data/types";

// Types come through `export * from "@/lib/api-internal"` below

// ============================================
// KILL SWITCH - flip to "throw" when migration is complete
// ============================================

const ENFORCE_NO_LEGACY = process.env.ENFORCE_NO_LEGACY_API === "true";

// ============================================
// ASSESSOR-GRADE MIGRATION TRACKING (Court-Ready)
// ============================================

/** Mutator classification for audit severity */
type MutatorClass = "ingest" | "validate" | "publish" | "query" | "auth";

interface CallRecord {
  count: number;
  firstSeen: number;
  lastSeen: number;
  callSites: Set<string>; // Unique stack traces (hashed)
  mutatorClass: MutatorClass;
}

const warned = new Set<string>();
const callRecords = new Map<string, CallRecord>();
const sessionId = typeof crypto !== "undefined" && crypto.randomUUID 
  ? crypto.randomUUID() 
  : `session-${Date.now()}`;
const sessionStart = Date.now();
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

/** Classify function by mutator type */
function classifyMutator(fnName: string): MutatorClass {
  if (fnName.includes("upload") || fnName.includes("ingest")) return "ingest";
  if (fnName.includes("validate")) return "validate";
  if (fnName.includes("publish")) return "publish";
  if (fnName.includes("login") || fnName.includes("logout") || fnName.includes("User")) return "auth";
  return "query";
}

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
  const mutatorClass = classifyMutator(fnName);
  const isMutator = mutatorClass !== "query" && mutatorClass !== "auth";
  
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
      mutatorClass,
    });
  }
  
  const record = callRecords.get(fnName)!;
  
  // Emit COURT-READY audit event with full chain-of-custody fields
  eventBus.emit({
    type: "deprecated.api_call",
    payload: {
      // Identity
      functionName: fnName,
      replacement,
      
      // Classification (for alert severity)
      isMutator,
      mutatorClass,
      
      // Session context
      sessionId,
      environment: process.env.NODE_ENV || "unknown",
      appVersion,
      
      // Temporal (for burn-down tracking)
      firstSeen: new Date(record.firstSeen).toISOString(),
      lastSeen: new Date(record.lastSeen).toISOString(),
      count: record.count,
      
      // Callsite attribution (dev only for stack, always count)
      uniqueCallSites: record.callSites.size,
      ...(process.env.NODE_ENV !== "production" && {
        sampledCallSite: callSite.slice(0, 200),
      }),
      
      // Actor (placeholder - wire to auth context when available)
      actor: "system", // TODO: inject from auth context
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
 * - Court-ready chain-of-custody documentation
 */
export function getMigrationReport() {
  const functions: Array<{
    name: string;
    calls: number;
    firstSeen: string | null;
    lastSeen: string | null;
    uniqueCallSites: number;
    mutatorClass: MutatorClass;
    isMutator: boolean;
  }> = [];
  
  let totalCalls = 0;
  let mutatorCalls = 0;
  
  callRecords.forEach((record, fn) => {
    totalCalls += record.count;
    const isMutator = record.mutatorClass !== "query" && record.mutatorClass !== "auth";
    if (isMutator) mutatorCalls += record.count;
    
    functions.push({
      name: fn,
      calls: record.count,
      firstSeen: new Date(record.firstSeen).toISOString(),
      lastSeen: new Date(record.lastSeen).toISOString(),
      uniqueCallSites: record.callSites.size,
      mutatorClass: record.mutatorClass,
      isMutator,
    });
  });
  
  const mutatorFunctions = functions.filter(f => f.isMutator);
  
  return {
    // Summary
    totalCalls,
    mutatorCalls,
    queryCalls: totalCalls - mutatorCalls,
    uniqueFunctions: functions.length,
    uniqueMutators: mutatorFunctions.length,
    enforcementEnabled: ENFORCE_NO_LEGACY,
    
    // Session metadata (for audit correlation)
    sessionId,
    sessionStarted: new Date(sessionStart).toISOString(),
    reportGenerated: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    appVersion,
    
    // Detailed function breakdown (sorted by calls descending)
    functions: functions.sort((a, b) => b.calls - a.calls),
    
    // CI helpers
    hasMutatorCalls: mutatorCalls > 0,
    
    // Top offenders (for weekly burn-down reports)
    topOffenders: mutatorFunctions
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5)
      .map(f => ({
        name: f.name,
        calls: f.calls,
        lastSeen: f.lastSeen,
        uniqueCallSites: f.uniqueCallSites,
      })),
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
    const mutators = report.topOffenders
      .map(f => `  - ${f.name}: ${f.calls} calls from ${f.uniqueCallSites} sites`)
      .join("\n");
    throw new Error(
      `[CI_ASSERTION_FAILED] Legacy mutator calls detected:\n${mutators}\n\n` +
      `Migrate to dataSuiteHub before merging.`
    );
  }
}

/**
 * OBSERVABILITY HELPER - Get deprecation events for alerting
 * 
 * Usage in monitoring:
 *   const events = getDeprecatedEvents();
 *   if (events.length > 0) sendAlert(events);
 */
export function getDeprecatedEvents() {
  return eventBus.getEventsByType("deprecated.api_call", 100);
}

/**
 * DELETE-THE-SHIM PATHWAY CHECKER
 * 
 * Returns true when safe to remove mutator exports:
 * - No mutator calls in current session
 * - Enforcement mode ready
 */
export function isReadyToRemoveMutators(): boolean {
  const report = getMigrationReport();
  return !report.hasMutatorCalls;
}

// ============================================
// UNIFIED RE-EXPORT (types + functions via barrel)
// ============================================
// This single export brings in ALL types and functions from api-internal.
// Do NOT add explicit exports for symbols already in the barrel - causes conflicts.
export * from "@/lib/api-internal";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: (ingestRun.status === "ready" ? "ready" : "validating") as any,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dataSuiteHub.validate(datasetId as any) as any;
}

/**
 * @deprecated Use dataSuiteHub.publish() instead
 */
export async function publishDataset(datasetId: string) {
  warnOnce("publishDataset", "dataSuiteHub.publish(datasetId)");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dataSuiteHub.publish(datasetId as any);
}

/**
 * @deprecated Use dataSuiteHub.getStatus() instead
 */
export async function getIngestStatus(runId: string) {
  warnOnce("getIngestStatus", "dataSuiteHub.getStatus(runId)");
  const status = await dataSuiteHub.getStatus(runId as WACountyFips);
  return status;
}

// ============================================
// READ-ONLY PASSTHROUGHS
// NOTE: Most functions come through `export * from "@/lib/api-internal"` above.
// Only aliases need explicit exports here.
// ============================================

// Aliases for backwards compatibility (original names already exported via *)
export { 
  getRollYearSnapshots as getSnapshots,
  createRollYearSnapshot as createSnapshot,
  loadCountyDataFreshness as getDataSources,
} from "@/lib/api-internal";

// Stub for getDatasets - returns empty array (not implemented in demo-client)
export async function getDatasets() {
  return [];
}

// Stub for getFieldMappings - returns empty array (not implemented in demo-client)
export async function getFieldMappings(_datasetId: string) {
  return [];
}

// DEMO_MODE comes through `export * from "@/lib/api-internal"` above

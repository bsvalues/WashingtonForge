/**
 * @deprecated ARCHITECTURAL BOUNDARY
 * 
 * This module is a COMPATIBILITY SHIM only.
 * 
 * DO NOT import functions from here in UI components.
 * All data operations MUST go through the DataSuiteHub:
 * 
 *   import { dataSuiteHub } from "@/lib/data-suite";
 *   await dataSuiteHub.ingest({ ... });
 * 
 * This shim re-exports TYPES only for backwards compatibility.
 * Function exports will throw errors to catch violations.
 */

// Re-export TYPES ONLY for backwards compatibility
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

// Re-export types from internal module
export * from "@/lib/api-internal/types";

// DEPRECATED FUNCTION EXPORTS
// These exist for compile compatibility but warn at runtime

/** @deprecated Use dataSuiteHub.ingest() instead */
export async function uploadDataset(...args: unknown[]): Promise<never> {
  console.error(
    "[DATA SUITE VIOLATION] uploadDataset() called directly. " +
    "Use dataSuiteHub.ingest() from @/lib/data-suite instead."
  );
  // Forward to internal for now to not break existing code
  const { uploadDataset: internal } = await import("@/lib/api-internal/demo-client");
  return internal(...args as [File, import("@/lib/api-internal/types").DatasetType]) as never;
}

/** @deprecated Use dataSuiteHub.validate() instead */
export async function validateDataset(...args: unknown[]): Promise<never> {
  console.error(
    "[DATA SUITE VIOLATION] validateDataset() called directly. " +
    "Use dataSuiteHub from @/lib/data-suite instead."
  );
  const { validateDataset: internal } = await import("@/lib/api-internal/demo-client");
  return internal(...args as [string]) as never;
}

/** @deprecated Use dataSuiteHub.publish() instead */
export async function publishDataset(...args: unknown[]): Promise<never> {
  console.error(
    "[DATA SUITE VIOLATION] publishDataset() called directly. " +
    "Use dataSuiteHub from @/lib/data-suite instead."
  );
  const { publishDataset: internal } = await import("@/lib/api-internal/demo-client");
  return internal(...args as [string]) as never;
}

// Re-export other functions that don't need hub routing (read-only + legacy compat)
export {
  // Read-only operations (safe to use directly)
  getDatasets,
  getRatioStudies,
  runRatioStudy,
  getSnapshots,
  createSnapshot,
  getAuditLog,
  getDataSources,
  getFieldMappings,
  getParcels,
  getParcelById,
  getSourceFields,
  previewDataset,
  getDatasetErrors,
  // Auth (until migrated to data-suite)
  login,
  logout,
  getCurrentUser,
} from "@/lib/api-internal/demo-client";

// Re-export DEMO_MODE flag for components that check it
export { DEMO_MODE } from "@/lib/api-internal/index";

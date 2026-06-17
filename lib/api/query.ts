/**
 * READ-ONLY QUERY API
 *
 * This module exports ONLY pure fetch/compute functions that do NOT mutate data.
 * Safe to import directly - no hub routing required.
 *
 * RULES:
 * - Functions here must be pure queries (no writes, no cache invalidation)
 * - No enqueue, publish, trigger, or job operations
 * - If it feels like a query but has side effects, it goes through the hub
 *
 * Usage:
 *   import { getParcels, getAuditLog } from "@/lib/api/query";
 */

// ============================================
// DATASET QUERIES (pure fetch)
// ============================================

export {
  getParcels,
  getParcelById,
  getSourceFields,
  previewDataset,
  getDatasetErrors,
} from "@/lib/api-internal";

// ============================================
// RATIO STUDIES (pure compute + fetch)
// ============================================

export {
  getRatioStudies,
  runRatioStudy, // Note: computes but doesn't persist
} from "@/lib/api-internal";

// ============================================
// SNAPSHOTS (fetch only - createSnapshot routes through hub)
// ============================================

export {
  getRollYearSnapshots as getSnapshots,
  // createSnapshot is intentionally NOT here - it mutates
} from "@/lib/api-internal";

// ============================================
// AUDIT LOG (pure fetch)
// ============================================

export { getAuditLog } from "@/lib/api-internal";

// ============================================
// DATA SOURCES (pure fetch)
// ============================================

export { loadCountyDataFreshness as getDataSources } from "@/lib/api-internal";

// ============================================
// AUTH (pure session read)
// ============================================

export {
  getCurrentUser,
  // login/logout are NOT here - they mutate session state
} from "@/lib/api-internal";

// ============================================
// TYPE EXPORTS (for convenience)
// Re-exported from barrel to comply with barrel-only import rule
// ============================================

export type {
  Dataset,
  DatasetType,
  DatasetStatus,
  FieldMapping,
  ValidationResult,
  RatioStudy,
  RatioStudyResults,
  AuditLogEntry,
  Parcel,
  ParcelFilter,
  MapLayer,
} from "@/lib/api-internal";

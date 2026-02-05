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
  getDatasets,
  getParcels,
  getParcelById,
  getSourceFields,
  previewDataset,
  getDatasetErrors,
  getFieldMappings,
} from "@/lib/api-internal/demo-client";

// ============================================
// RATIO STUDIES (pure compute + fetch)
// ============================================

export {
  getRatioStudies,
  runRatioStudy, // Note: computes but doesn't persist
} from "@/lib/api-internal/demo-client";

// ============================================
// SNAPSHOTS (fetch only - createSnapshot routes through hub)
// ============================================

export {
  getSnapshots,
  // createSnapshot is intentionally NOT here - it mutates
} from "@/lib/api-internal/demo-client";

// ============================================
// AUDIT LOG (pure fetch)
// ============================================

export {
  getAuditLog,
} from "@/lib/api-internal/demo-client";

// ============================================
// DATA SOURCES (pure fetch)
// ============================================

export {
  getDataSources,
} from "@/lib/api-internal/demo-client";

// ============================================
// AUTH (pure session read)
// ============================================

export {
  getCurrentUser,
  // login/logout are NOT here - they mutate session state
} from "@/lib/api-internal/demo-client";

// ============================================
// TYPE EXPORTS (for convenience)
// ============================================

export type {
  Dataset,
  DatasetType,
  DatasetStatus,
  FieldMapping,
  ValidationResult,
  RatioStudy,
  RatioStudyResult,
  Snapshot,
  AuditLogEntry,
  DataSource,
  Parcel,
} from "@/lib/api-internal/types";

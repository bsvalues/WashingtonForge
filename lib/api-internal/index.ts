// TerraFusion API Adapter
// Single entry point - swaps between demo and real backend via env flag
// Usage: import { getParcels, getMapLayers } from "@/lib/api"

// Re-export types for convenience
export * from "./types";

// ============================================
// Demo Mode (env-driven — F1)
// ============================================

/**
 * DEMO_MODE: true when the app should serve simulated/demo data.
 *
 * Driven by NEXT_PUBLIC_DEMO_MODE:
 *  - unset / "true"  → demo mode ON (default, safe for zero-infra runs)
 *  - "false"         → demo mode OFF (real backend expected)
 *
 * NOTE: This flag gates the *client-side* demo helpers. The server-side data
 * layer (lib/db) independently decides live-vs-simulated from actual database
 * connectivity (see /api/health), so a misconfigured flag can never silently
 * serve fake data as if it were real.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

// ============================================
// Direct Re-exports from Demo Client
// ============================================
// Using direct re-exports instead of client.* pattern for static analysis.
// When switching to production, change these to re-export from api-client.

export {
  // Authentication
  login,
  logout,
  getCurrentUser,

  // Counties
  getCounties,
  selectCounty,

  // Data Ingestion
  uploadDataset,
  validateDataset,
  getDatasetErrors,
  downloadErrorCsv,
  getSourceFields,
  saveFieldMapping,
  previewDataset,
  publishDataset,

  // Parcels & Map
  getParcels,
  getParcelById,
  getParcelGeoJson,
  selectParcelsInPolygon,
  getAggregateStats,
  getMapLayers,
  getNeighborhoods,
  getPropertyClasses,

  // Ratio Studies
  getRatioStudies,
  getRatioStudyById,
  runRatioStudy,
  exportRatioStudyReport,

  // Audit Log
  getAuditLog,

  // Roll Year Snapshots
  getRollYearSnapshots,
  createRollYearSnapshot,
  publishSnapshot,

  // Dataset Versions
  getDatasetVersions,
  getDatasetVersionById,

  // VEI Findings
  getVEIFindings,
  getDriftHotspots,

  // Calibration (Benton Method)
  getCalibrationLevers,
  getCalibrationHistory,
  simulateCalibration,
  applyCalibration,

  // Export Snapshot
  exportRatioSnapshot,

  // Data Sources & Freshness
  loadCountyDataFreshness,
} from "./demo-client";

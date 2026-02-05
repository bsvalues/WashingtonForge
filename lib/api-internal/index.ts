// TerraFusion API Adapter
// Single entry point - swaps between demo and real backend via env flag
// Usage: import { getParcels, getMapLayers } from "@/lib/api"

// Re-export types for convenience
export * from "./types";

// ============================================
// Demo Mode (hardcoded for now - no backend connected)
// ============================================

/**
 * DEMO_MODE: Set to true for UI demo, false when real backend is ready.
 *
 * When you connect a real backend, change this to false or use:
 * export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
 */
export const DEMO_MODE = true;

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

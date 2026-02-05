// TerraFusion API Adapter
// Single entry point - swaps between demo and real backend via env flag
// Usage: import { client } from "@/lib/api"

import * as demoClient from "./demo-client";
import * as apiClient from "./api-client";

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
// Client Adapter
// ============================================

/**
 * Unified API client that automatically routes to demo or real backend.
 *
 * In demo mode: Returns mock data from fixtures (no network calls)
 * In production: Makes real HTTP requests to backend services
 *
 * Switching from demo to production is a single env flag change.
 */
export const client = DEMO_MODE ? demoClient : apiClient;

// ============================================
// Named Exports (for convenience)
// ============================================

// Authentication
export const login = client.login;
export const logout = client.logout;
export const getCurrentUser = client.getCurrentUser;

// Counties
export const getCounties = client.getCounties;
export const selectCounty = client.selectCounty;

// Data Ingestion
export const uploadDataset = client.uploadDataset;
export const validateDataset = client.validateDataset;
export const getDatasetErrors = client.getDatasetErrors;
export const downloadErrorCsv = client.downloadErrorCsv;
export const getSourceFields = client.getSourceFields;
export const saveFieldMapping = client.saveFieldMapping;
export const previewDataset = client.previewDataset;
export const publishDataset = client.publishDataset;

// Parcels & Map
export const getParcels = client.getParcels;
export const getParcelById = client.getParcelById;
export const getParcelGeoJson = client.getParcelGeoJson;
export const selectParcelsInPolygon = client.selectParcelsInPolygon;
export const getAggregateStats = client.getAggregateStats;
export const getMapLayers = client.getMapLayers;
export const getNeighborhoods = client.getNeighborhoods;
export const getPropertyClasses = client.getPropertyClasses;

// Ratio Studies
export const getRatioStudies = client.getRatioStudies;
export const getRatioStudyById = client.getRatioStudyById;
export const runRatioStudy = client.runRatioStudy;
export const exportRatioStudyReport = client.exportRatioStudyReport;

// Audit Log
export const getAuditLog = client.getAuditLog;

// Roll Year Snapshots
export const getRollYearSnapshots = client.getRollYearSnapshots;
export const createRollYearSnapshot = client.createRollYearSnapshot;
export const publishSnapshot = client.publishSnapshot;

// Dataset Versions
export const getDatasetVersions = client.getDatasetVersions;
export const getDatasetVersionById = client.getDatasetVersionById;

// VEI Findings
export const getVEIFindings = client.getVEIFindings;
export const getDriftHotspots = client.getDriftHotspots;

// Calibration (Benton Method)
export const getCalibrationLevers = client.getCalibrationLevers;
export const getCalibrationHistory = client.getCalibrationHistory;
export const simulateCalibration = client.simulateCalibration;
export const applyCalibration = client.applyCalibration;

// Export Snapshot
export const exportRatioSnapshot = client.exportRatioSnapshot;

// Data Sources & Freshness
export const loadCountyDataFreshness = client.loadCountyDataFreshness;

// TerraFusion Demo Client
// Returns mock data from fixtures - no network calls
// Used when NEXT_PUBLIC_DEMO_MODE=true

import type { GeoJSON } from "geojson";
import type {
  User,
  County,
  Parcel,
  RatioStudy,
  AuditLogEntry,
  RollYearSnapshot,
  MapLayer,
  AggregateStats,
  AuthResponse,
  LoginCredentials,
  UserRole,
  Dataset,
  DatasetType,
  ValidationResult,
  ValidationError,
  FieldMapping,
  ParcelFilter,
  SelectionResult,
  VEIFinding,
  CalibrationLever,
  CalibrationPatch,
  CalibrationSimulation,
  CalibrationLeverApply,
  DatasetVersion,
  DatasetMetrics,
  VEIScope,
  CountyDataFreshness,
} from "./types";

import {
  MOCK_USER,
  MOCK_COUNTIES,
  MOCK_PARCELS,
  MOCK_RATIO_STUDIES,
  MOCK_AUDIT_LOG,
  MOCK_SNAPSHOTS,
  MOCK_LAYERS,
  MOCK_STATS,
  MOCK_VALIDATION_RESULT,
  MOCK_SOURCE_FIELDS,
  MOCK_NEIGHBORHOODS,
  MOCK_PROPERTY_CLASSES,
  DEMO_SESSION,
  MOCK_VEI_FINDINGS,
  MOCK_COUNTY_DATA_FRESHNESS,
  MOCK_CALIBRATION_LEVERS,
  MOCK_CALIBRATION_PATCHES,
  MOCK_DATASET_VERSIONS,
  MOCK_DRIFT_HOTSPOTS,
  type DriftHotspot,
} from "@/lib/fixtures";

// Simulate network delay for realistic UX
const delay = (ms: number = 300) => new Promise((r) => setTimeout(r, ms));

// ============================================
// Authentication
// ============================================

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  await delay();
  return {
    user: MOCK_USER,
    token: `demo-token-${Date.now()}`,
  };
}

export async function logout(): Promise<void> {
  await delay(100);
}

export async function getCurrentUser(): Promise<User> {
  await delay();
  return MOCK_USER;
}

// ============================================
// Counties
// ============================================

export async function getCounties(): Promise<County[]> {
  await delay();
  return MOCK_COUNTIES;
}

export async function selectCounty(countyId: string, role: UserRole): Promise<User> {
  await delay();
  const county = MOCK_COUNTIES.find((c) => c.id === countyId);
  return {
    ...MOCK_USER,
    id: DEMO_SESSION.userId,
    role,
    countyId,
    countyName: county?.name || "Unknown County",
  };
}

// ============================================
// Data Ingestion
// ============================================

export async function uploadDataset(file: File, datasetType: DatasetType): Promise<Dataset> {
  await delay(500);

  // Detect bulk packages and geodatabases
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  const isGeoDatabase =
    file.type === "application/x-esri-geodatabase" || file.name.endsWith(".gdb");
  const isBulkPackage = ext === ".zip" || isGeoDatabase;

  // Simulate higher row counts for bulk packages
  const baseRowCount = isBulkPackage ? 15000 : 1500;
  const rowCount = Math.floor(baseRowCount + Math.random() * 5000);

  return {
    id: `ds-${Date.now()}`,
    name: file.name,
    type: isBulkPackage ? (isGeoDatabase ? "geodatabase" : "bulk_package") : datasetType,
    status: "validating",
    rowCount,
    errorCount: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function validateDataset(datasetId: string): Promise<ValidationResult> {
  await delay(800);
  return MOCK_VALIDATION_RESULT;
}

export async function getDatasetErrors(datasetId: string): Promise<ValidationError[]> {
  await delay();
  return MOCK_VALIDATION_RESULT.errors;
}

export async function downloadErrorCsv(datasetId: string): Promise<Blob> {
  await delay();
  const csv =
    "row,field,value,message\n" +
    MOCK_VALIDATION_RESULT.errors
      .map((e) => `${e.row},"${e.field}","${e.value}","${e.message}"`)
      .join("\n");
  return new Blob([csv], { type: "text/csv" });
}

export async function getSourceFields(datasetId: string): Promise<string[]> {
  await delay();
  return MOCK_SOURCE_FIELDS;
}

export async function saveFieldMapping(datasetId: string, mappings: FieldMapping[]): Promise<void> {
  await delay();
}

export async function previewDataset(
  datasetId: string,
  limit?: number
): Promise<Record<string, unknown>[]> {
  await delay();
  return MOCK_PARCELS.slice(0, limit || 10).map((p) => ({
    parcel_id: p.parcelId,
    situs: p.situs,
    land_value: p.landValue,
    imp_value: p.impValue,
    sale_price: p.salePrice,
    sale_date: p.saleDate,
    property_class: p.propertyClass,
    neighborhood: p.neighborhood,
    year_built: p.yearBuilt,
  }));
}

export async function publishDataset(datasetId: string): Promise<Dataset> {
  await delay(600);
  return {
    id: datasetId,
    name: "Published Dataset",
    type: "parcel",
    status: "published",
    rowCount: 1487,
    errorCount: 13,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    publishedAt: new Date().toISOString(),
  };
}

// ============================================
// Parcels & Map
// ============================================

export async function getParcels(filter?: ParcelFilter): Promise<Parcel[]> {
  await delay();
  let parcels = [...MOCK_PARCELS];

  if (filter?.neighborhood?.length) {
    parcels = parcels.filter((p) => filter.neighborhood!.includes(p.neighborhood));
  }
  if (filter?.propertyClass?.length) {
    parcels = parcels.filter((p) => filter.propertyClass!.includes(p.propertyClass));
  }
  if (filter?.equityStatus?.length) {
    parcels = parcels.filter((p) => filter.equityStatus!.includes(p.equityStatus));
  }

  return parcels;
}

export async function getParcelById(parcelId: string): Promise<Parcel> {
  await delay();
  return MOCK_PARCELS.find((p) => p.id === parcelId || p.parcelId === parcelId) || MOCK_PARCELS[0];
}

export async function getParcelGeoJson(filter?: ParcelFilter): Promise<GeoJSON.FeatureCollection> {
  await delay();
  const parcels = await getParcels(filter);
  return {
    type: "FeatureCollection",
    features: parcels
      .filter((p) => p.geometry)
      .map((p) => ({
        type: "Feature" as const,
        id: p.id,
        geometry: p.geometry!,
        properties: {
          parcelId: p.parcelId,
          situs: p.situs,
          totalValue: p.totalValue,
          equityStatus: p.equityStatus,
          ratio: p.ratio,
        },
      })),
  };
}

export async function selectParcelsInPolygon(polygon: GeoJSON.Polygon): Promise<SelectionResult> {
  await delay();
  return {
    parcelIds: MOCK_PARCELS.map((p) => p.id),
    count: MOCK_PARCELS.length,
    aggregateStats: MOCK_STATS,
  };
}

export async function getAggregateStats(parcelIds: string[]): Promise<AggregateStats> {
  await delay();
  return MOCK_STATS;
}

export async function getMapLayers(): Promise<MapLayer[]> {
  await delay();
  return MOCK_LAYERS;
}

export async function getNeighborhoods(): Promise<string[]> {
  await delay();
  return MOCK_NEIGHBORHOODS;
}

export async function getPropertyClasses(): Promise<string[]> {
  await delay();
  return MOCK_PROPERTY_CLASSES;
}

// ============================================
// Ratio Studies
// ============================================

export async function getRatioStudies(): Promise<RatioStudy[]> {
  await delay();
  return MOCK_RATIO_STUDIES;
}

export async function getRatioStudyById(studyId: string): Promise<RatioStudy> {
  await delay();
  return MOCK_RATIO_STUDIES.find((s) => s.id === studyId) || MOCK_RATIO_STUDIES[0];
}

export async function runRatioStudy(params: {
  name: string;
  rollYear: number;
  filter?: ParcelFilter;
}): Promise<RatioStudy> {
  await delay(1000);
  return {
    id: `rs-new-${Date.now()}`,
    name: params.name,
    status: "completed",
    rollYear: params.rollYear,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    results: MOCK_RATIO_STUDIES[0].results,
  };
}

export async function exportRatioStudyReport(
  studyId: string,
  format: "pdf" | "csv" | "xlsx"
): Promise<Blob> {
  await delay();
  const content = `Ratio Study Report - ${studyId}\nFormat: ${format}\n\nThis is a demo export.`;
  return new Blob([content], { type: "text/plain" });
}

// ============================================
// Audit Log
// ============================================

export async function getAuditLog(params?: {
  limit?: number;
  offset?: number;
  action?: string;
  userId?: string;
}): Promise<AuditLogEntry[]> {
  await delay();
  let logs = [...MOCK_AUDIT_LOG];

  if (params?.action) {
    logs = logs.filter((l) => l.action === params.action);
  }
  if (params?.userId) {
    logs = logs.filter((l) => l.userId === params.userId);
  }
  if (params?.offset) {
    logs = logs.slice(params.offset);
  }
  if (params?.limit) {
    logs = logs.slice(0, params.limit);
  }

  return logs;
}

// ============================================
// Roll Year Snapshots
// ============================================

export async function getRollYearSnapshots(): Promise<RollYearSnapshot[]> {
  await delay();
  return MOCK_SNAPSHOTS;
}

export async function createRollYearSnapshot(rollYear: number): Promise<RollYearSnapshot> {
  await delay(500);
  return {
    id: `snap-${rollYear}`,
    rollYear,
    createdAt: new Date().toISOString(),
    parcelCount: 87420,
    totalAssessedValue: 12500000000,
    status: "draft",
  };
}

export async function publishSnapshot(snapshotId: string): Promise<RollYearSnapshot> {
  await delay();
  const snapshot = MOCK_SNAPSHOTS.find((s) => s.id === snapshotId) || MOCK_SNAPSHOTS[0];
  return { ...snapshot, status: "published" };
}

// ============================================
// Dataset Versions
// ============================================

export async function getDatasetVersions(countyId?: string): Promise<DatasetVersion[]> {
  await delay();
  if (countyId) {
    return MOCK_DATASET_VERSIONS.filter((v) => v.countyId === countyId);
  }
  return MOCK_DATASET_VERSIONS;
}

export async function getDatasetVersionById(versionId: string): Promise<DatasetVersion> {
  await delay();
  return MOCK_DATASET_VERSIONS.find((v) => v.id === versionId) || MOCK_DATASET_VERSIONS[0];
}

// ============================================
// VEI Findings
// ============================================

export async function getVEIFindings(datasetVersionId?: string): Promise<VEIFinding[]> {
  await delay();
  return MOCK_VEI_FINDINGS;
}

export async function getDriftHotspots(): Promise<DriftHotspot[]> {
  await delay();
  return MOCK_DRIFT_HOTSPOTS;
}

// ============================================
// Calibration (Benton Method)
// ============================================

export async function getCalibrationLevers(): Promise<CalibrationLever[]> {
  await delay();
  return MOCK_CALIBRATION_LEVERS;
}

export async function getCalibrationHistory(
  datasetVersionId?: string
): Promise<CalibrationPatch[]> {
  await delay();
  return MOCK_CALIBRATION_PATCHES;
}

export async function simulateCalibration(params: {
  datasetVersionId: string;
  scope: VEIScope;
  scopeId?: string;
  levers: CalibrationLeverApply[];
}): Promise<CalibrationSimulation> {
  await delay(800);

  // Simulate improvement based on lever adjustments
  const currentVersion =
    MOCK_DATASET_VERSIONS.find((v) => v.id === params.datasetVersionId) || MOCK_DATASET_VERSIONS[0];
  const beforeMetrics = currentVersion.metrics!;

  // Calculate simulated after metrics (fake improvement)
  const afterMetrics: DatasetMetrics = {
    ...beforeMetrics,
    medianRatio: Math.min(1.0, beforeMetrics.medianRatio + 0.015),
    cod: Math.max(8.0, beforeMetrics.cod - 1.2),
    prd: Math.max(0.98, beforeMetrics.prd - 0.01),
    prb: beforeMetrics.prb + 0.004,
  };

  return {
    levers: params.levers,
    scope: params.scope,
    scopeId: params.scopeId,
    beforeMetrics,
    afterMetrics,
    improvement: afterMetrics.cod < beforeMetrics.cod && afterMetrics.prd < beforeMetrics.prd,
  };
}

export async function applyCalibration(params: {
  datasetVersionId: string;
  scope: VEIScope;
  scopeId?: string;
  levers: CalibrationLeverApply[];
}): Promise<{ patch: CalibrationPatch; newVersion: DatasetVersion }> {
  await delay(1200);

  const currentVersion =
    MOCK_DATASET_VERSIONS.find((v) => v.id === params.datasetVersionId) || MOCK_DATASET_VERSIONS[0];
  const beforeMetrics = currentVersion.metrics!;

  const afterMetrics: DatasetMetrics = {
    ...beforeMetrics,
    medianRatio: Math.min(1.0, beforeMetrics.medianRatio + 0.015),
    cod: Math.max(8.0, beforeMetrics.cod - 1.2),
    prd: Math.max(0.98, beforeMetrics.prd - 0.01),
    prb: beforeMetrics.prb + 0.004,
    totalAssessedValue: Math.round(beforeMetrics.totalAssessedValue * 1.01),
  };

  const newVersionId = `dsv-${Date.now()}`;

  const patch: CalibrationPatch = {
    id: `cal-${Date.now()}`,
    fromVersionId: params.datasetVersionId,
    toVersionId: newVersionId,
    scope: params.scope,
    scopeId: params.scopeId,
    levers: params.levers,
    createdBy: DEMO_SESSION.userId,
    createdAt: new Date().toISOString(),
    beforeMetrics,
    afterMetrics,
  };

  const newVersion: DatasetVersion = {
    id: newVersionId,
    datasetId: currentVersion.datasetId,
    countyId: currentVersion.countyId,
    rollYear: currentVersion.rollYear,
    version: currentVersion.version + 1,
    status: "draft",
    rowCount: currentVersion.rowCount,
    createdAt: new Date().toISOString(),
    metrics: afterMetrics,
  };

  return { patch, newVersion };
}

// ============================================
// Export Ratio Snapshot
// ============================================

export async function exportRatioSnapshot(runId: string): Promise<Blob> {
  await delay(500);
  const content = `
=====================================
TERRAFUSION RATIO SNAPSHOT
=====================================
Run ID: ${runId}
Generated: ${new Date().toISOString()}
County: Benton County, WA
Roll Year: 2024

IAAO COMPLIANCE SUMMARY
-----------------------
Median Ratio: 0.965 (Target: 0.90-1.10) [PASS]
COD: 12.4 (Target: <15.0) [PASS]
PRD: 1.02 (Target: 0.98-1.03) [PASS]
PRB: -0.008 (Target: -0.05 to 0.05) [PASS]

SCREENING SUMMARY
-----------------
Total Sales: 2,345
Valid Sales: 1,842
Screened Out: 503
Outliers Removed: 23

STRATA BREAKDOWN
----------------
Downtown: 0.94 ratio, 11.2 COD (245 sales)
Westside: 0.98 ratio, 13.1 COD (412 sales)
Eastgate: 0.97 ratio, 10.8 COD (328 sales)
Northgate: 0.96 ratio, 12.5 COD (521 sales)
Southend: 0.95 ratio, 14.2 COD (336 sales)

=====================================
Demo export - Replace with PDF in production
=====================================
`;
  return new Blob([content], { type: "text/plain" });
}

// ============================================
// Data Sources & Freshness
// ============================================

export async function loadCountyDataFreshness(): Promise<CountyDataFreshness[]> {
  await delay();
  return MOCK_COUNTY_DATA_FRESHNESS;
}

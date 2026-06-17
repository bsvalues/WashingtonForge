// TerraFusion API Types
// Shared types for API client, fixtures, and backend contracts

import type { GeoJSON } from "geojson";

// ============================================
// Authentication & Users
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  countyId: string;
  countyName: string;
}

export type UserRole = "assessor" | "analyst" | "admin" | "viewer";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================
// Counties
// ============================================

export interface County {
  id: string;
  name: string;
  state: string;
  parcelCount: number;
}

// ============================================
// Data Ingestion
// ============================================

export interface Dataset {
  id: string;
  name: string;
  type: DatasetType;
  status: DatasetStatus;
  rowCount: number;
  errorCount: number;
  createdAt: string;
  publishedAt?: string;
  countyId?: string; // Tenant boundary - optional during initial upload
}

export type DatasetType =
  | "parcel"
  | "sales"
  | "building"
  | "assessment"
  | "bulk_package"
  | "geodatabase";
export type DatasetStatus =
  | "uploading"
  | "validating"
  | "mapping"
  | "ready"
  | "published"
  | "failed";

// ============================================
// Dataset Versioning (Immutable Snapshots)
// ============================================

export interface DatasetVersion {
  id: string;
  datasetId: string;
  countyId: string; // Tenant boundary
  rollYear: number;
  version: number;
  status: DatasetVersionStatus;
  rowCount: number;
  createdAt: string;
  publishedAt?: string;
  metrics?: DatasetMetrics;
}

export type DatasetVersionStatus = "draft" | "validating" | "ready" | "published" | "archived";

export interface DatasetMetrics {
  totalParcels: number;
  totalAssessedValue: number;
  totalSales: number;
  medianRatio: number;
  cod: number;
  prd: number;
  prb: number;
}

// ============================================
// IAAO Compliance Thresholds
// ============================================

export interface IAAOComplianceThresholds {
  // Ratio standards
  ratioMin: number; // 0.90
  ratioMax: number; // 1.10
  // COD standards (single-family residential)
  codMax: number; // 15.0 for single-family, 20.0 for income-producing
  // PRD standards
  prdMin: number; // 0.98
  prdMax: number; // 1.03
  // PRB standards
  prbMin: number; // -0.05
  prbMax: number; // 0.05
}

export const IAAO_RESIDENTIAL_THRESHOLDS: IAAOComplianceThresholds = {
  ratioMin: 0.9,
  ratioMax: 1.1,
  codMax: 15.0,
  prdMin: 0.98,
  prdMax: 1.03,
  prbMin: -0.05,
  prbMax: 0.05,
};

export const IAAO_COMMERCIAL_THRESHOLDS: IAAOComplianceThresholds = {
  ratioMin: 0.9,
  ratioMax: 1.1,
  codMax: 20.0,
  prdMin: 0.98,
  prdMax: 1.03,
  prbMin: -0.05,
  prbMax: 0.05,
};

export type ComplianceStatus = "compliant" | "warning" | "non-compliant";

export interface ComplianceResult {
  overall: ComplianceStatus;
  ratio: ComplianceStatus;
  cod: ComplianceStatus;
  prd: ComplianceStatus;
  prb: ComplianceStatus;
  details: string[];
}

// ============================================
// Validation with Rule Codes
// ============================================

export interface ValidationResult {
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  errors: ValidationError[];
  byCategory: ValidationCategorySummary[];
}

export interface ValidationCategorySummary {
  category: ValidationCategory;
  count: number;
  blocking: boolean;
}

export type ValidationCategory = "missing" | "format" | "range" | "geometry" | "duplicate";

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
  code: ValidationErrorCode;
  category: ValidationCategory;
  blocking: boolean;
}

export type ValidationErrorCode =
  // Missing (REQ_*)
  | "REQ_PARCEL_ID"
  | "REQ_SITUS"
  | "REQ_LAND_VALUE"
  | "REQ_SALE_PRICE"
  | "REQ_SALE_DATE"
  // Format (FMT_*)
  | "FMT_PARCEL_ID"
  | "FMT_SALE_DATE"
  | "FMT_NUMERIC"
  | "FMT_GEOMETRY"
  // Range (RNG_*)
  | "RNG_SALE_PRICE"
  | "RNG_LAND_VALUE"
  | "RNG_YEAR_BUILT"
  | "RNG_RATIO"
  // Geometry (GEO_*)
  | "GEO_INVALID"
  | "GEO_OUTSIDE_COUNTY"
  | "GEO_SELF_INTERSECT"
  // Duplicate (DUP_*)
  | "DUP_PARCEL_ID"
  | "DUP_SALE";

export interface FieldMapping {
  sourceField: string;
  targetField: TargetField;
}

export type TargetField =
  | "parcel_id"
  | "situs"
  | "land_value"
  | "imp_value"
  | "sale_price"
  | "sale_date"
  | "geometry"
  | "property_class"
  | "neighborhood"
  | "year_built"
  | "square_feet";

// ============================================
// Parcels & Map (matches PostGIS model)
// ============================================

export interface Parcel {
  id: string;
  parcelId: string;
  situs: string;
  landValue: number;
  impValue: number;
  totalValue: number;
  salePrice?: number;
  saleDate?: string;
  equityStatus: EquityStatus;
  ratio?: number;
  propertyClass: string;
  neighborhood: string;
  yearBuilt?: number;
  geometry?: GeoJSON.Geometry;
}

export type EquityStatus = "fair" | "progressive" | "regressive";

export interface ParcelFilter {
  propertyClass?: string[];
  neighborhood?: string[];
  yearRange?: [number, number];
  valueTier?: string;
  equityStatus?: EquityStatus[];
}

export interface SelectionResult {
  parcelIds: string[];
  count: number;
  aggregateStats: AggregateStats;
}

export interface AggregateStats {
  medianRatio: number;
  cod: number; // Coefficient of Dispersion (IAAO)
  prd: number; // Price-Related Differential (IAAO)
  prb: number; // Price-Related Bias (IAAO)
  meanValue: number;
  totalValue: number;
}

export interface MapLayer {
  id: string;
  name: string;
  type: "parcels" | "equity" | "sales" | "neighborhoods" | "zoning";
  visible: boolean;
}

// ============================================
// Ratio Studies (IAAO-compliant)
// ============================================

export interface RatioStudy {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  rollYear: number;
  createdAt: string;
  completedAt?: string;
  results?: RatioStudyResults;
}

export interface RatioStudyResults {
  medianRatio: number;
  meanRatio: number;
  cod: number;
  prd: number;
  prb: number;
  sampleSize: number;
  outlierCount: number;
  byNeighborhood: NeighborhoodStats[];
  byPropertyClass: PropertyClassStats[];
}

export interface NeighborhoodStats {
  neighborhood: string;
  medianRatio: number;
  cod: number;
  sampleSize: number;
}

export interface PropertyClassStats {
  propertyClass: string;
  medianRatio: number;
  cod: number;
  sampleSize: number;
}

// ============================================
// Audit Log (First-class event system)
// ============================================

export type AuditAction =
  // Authentication
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  // Ingestion
  | "INGEST_UPLOAD"
  | "INGEST_VALIDATE"
  | "INGEST_MAP_FIELDS"
  | "INGEST_PREVIEW"
  | "INGEST_PUBLISH"
  // Dataset
  | "DATASET_CREATE"
  | "DATASET_PUBLISH"
  | "DATASET_ARCHIVE"
  // Ratio Studies
  | "RATIO_RUN_CREATE"
  | "RATIO_RUN_COMPLETE"
  | "RATIO_EXPORT"
  // Cockpit
  | "COCKPIT_VIEW"
  | "COCKPIT_SELECT"
  | "COCKPIT_FILTER"
  // Snapshots
  | "SNAPSHOT_CREATE"
  | "SNAPSHOT_PUBLISH"
  // Admin
  | "USER_CREATE"
  | "USER_UPDATE"
  | "ROLE_CHANGE";

export type AuditResourceType =
  | "session"
  | "user"
  | "dataset"
  | "dataset_version"
  | "parcel"
  | "ratio_study"
  | "snapshot"
  | "selection";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  countyId: string; // Tenant boundary - REQUIRED
  datasetVersionId?: string; // Links to specific dataset version
  timestamp: string;
  payloadHash?: string; // Stable summary for change tracking
  details?: Record<string, unknown>;
}

export interface AuditEventPayload {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  countyId: string;
  datasetVersionId?: string;
  details?: Record<string, unknown>;
}

// ============================================
// VEI Findings (Vertical Equity Intelligence)
// ============================================

export type VEIIssueType = "uniformity" | "vertical_equity" | "level";
export type VEISeverity = "info" | "warn" | "fail";
export type VEIScope = "overall" | "strata" | "class" | "tier";

export interface VEIFinding {
  id: string;
  scope: VEIScope;
  scopeId?: string; // e.g., strata_id, class name, tier name
  issue: VEIIssueType;
  severity: VEISeverity;
  metric: string; // COD, PRD, PRB, median_ratio
  currentValue: number;
  threshold: number;
  direction: "above" | "below";
  description: string;
  recommendedLevers: CalibrationLeverType[];
}

// ============================================
// Calibration (Benton Method)
// ============================================

export type CalibrationLeverType =
  | "schedule_factor"
  | "depreciation_curve_shift"
  | "quality_mapping_adjust"
  | "location_factor_adjust"
  | "land_allocation_adjust";

export interface CalibrationLever {
  type: CalibrationLeverType;
  label: string;
  description: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  unit: string;
}

export interface CalibrationPatch {
  id: string;
  fromVersionId: string;
  toVersionId: string;
  scope: VEIScope;
  scopeId?: string;
  levers: CalibrationLeverApply[];
  createdBy: string;
  createdAt: string;
  beforeMetrics: DatasetMetrics;
  afterMetrics: DatasetMetrics;
}

export interface CalibrationLeverApply {
  type: CalibrationLeverType;
  value: number;
  delta: number;
}

export interface CalibrationSimulation {
  levers: CalibrationLeverApply[];
  scope: VEIScope;
  scopeId?: string;
  beforeMetrics: DatasetMetrics;
  afterMetrics: DatasetMetrics;
  improvement: boolean;
}

// ============================================
// Roll Year Snapshots
// ============================================

export interface RollYearSnapshot {
  id: string;
  rollYear: number;
  createdAt: string;
  parcelCount: number;
  totalAssessedValue: number;
  status: "draft" | "published" | "archived";
}

// ============================================
// Data Sources & Freshness
// ============================================

export type OverlayStatus = "current" | "stale" | "none" | "error";

export type UpdateLane = "A_live_sync" | "B_scheduled_snapshot" | "C_zero_it_upload";

export interface CountyDataFreshness {
  countyId: string;
  countyName: string;
  baselineCoveragePct: number;
  baselineSourceLabel: string;
  overlayStatus: OverlayStatus;
  overlaySourceLabel?: string | null;
  lastOverlayUpdateAt?: string | null;
  updateLane: UpdateLane;
  updateLaneDetail: string;
  stalenessNote?: string | null;
}

// ============================================
// API Error Handling
// ============================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

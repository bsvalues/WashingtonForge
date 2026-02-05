/**
 * DataSuite Types
 * 
 * Central type definitions for the Intelligent Data Suite.
 * Re-exports from wa-data where appropriate, adds IDS-specific types.
 */

// Re-export core WA types
export type {
  WACountyFips,
  WACountyInfo,
  CountyDataStatus,
  ParcelFabricStatus,
  CountyRollStatus,
  SalesStreamStatus,
  DataCapability,
  OnboardingPath,
  IngestRun,
  LineageEvent,
  CountyExportFingerprint,
} from "../wa-data/types";

export { WA_COUNTIES, normalizeParcelId } from "../wa-data/types";

// ============================================
// Data Product Types
// ============================================

/**
 * The 4 canonical data products (everything else derives from them)
 */
export type DataProductType = "PARCEL_FABRIC" | "COUNTY_ROLL" | "SALES_STREAM" | "BUILDINGS";

export interface DataProduct {
  type: DataProductType;
  displayName: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
  freshnessSLA: FreshnessSLA;
  routingTargets: string[];
}

export const DATA_PRODUCTS: Record<DataProductType, DataProduct> = {
  PARCEL_FABRIC: {
    type: "PARCEL_FABRIC",
    displayName: "Parcel Fabric",
    description: "Geometry + parcel spine from WA Geo Portal or county GIS",
    requiredFields: ["parcel_id", "geometry", "county_fips"],
    optionalFields: ["situs_address", "legal_description", "acreage"],
    validationRules: [
      { field: "geometry", rule: "valid_polygon", severity: "error" },
      { field: "parcel_id", rule: "not_empty", severity: "error" },
    ],
    freshnessSLA: { maxAgeHours: 168, refreshCadence: "weekly" },
    routingTargets: ["cockpit-map", "comps-engine"],
  },
  COUNTY_ROLL: {
    type: "COUNTY_ROLL",
    displayName: "County Roll",
    description: "Values + situs + characteristics from assessor CAMA",
    requiredFields: ["parcel_id", "total_value", "roll_year"],
    optionalFields: [
      "land_value",
      "improvement_value",
      "situs_address",
      "property_class",
      "neighborhood",
      "year_built",
      "sq_ft",
      "bedrooms",
      "bathrooms",
    ],
    validationRules: [
      { field: "total_value", rule: "positive_number", severity: "error" },
      { field: "roll_year", rule: "valid_year", severity: "error" },
      { field: "parcel_id", rule: "not_empty", severity: "error" },
    ],
    freshnessSLA: { maxAgeHours: 24, refreshCadence: "daily" },
    routingTargets: ["cockpit-map", "comps-engine", "ratio-studies", "calibration", "appeals"],
  },
  SALES_STREAM: {
    type: "SALES_STREAM",
    displayName: "Sales Stream",
    description: "Validated sales with arms-length awareness",
    requiredFields: ["parcel_id", "sale_price", "sale_date"],
    optionalFields: [
      "buyer",
      "seller",
      "instrument_number",
      "validity_code",
      "arms_length",
      "excluded_reason",
    ],
    validationRules: [
      { field: "sale_price", rule: "positive_number", severity: "error" },
      { field: "sale_date", rule: "valid_date", severity: "error" },
      { field: "parcel_id", rule: "not_empty", severity: "error" },
    ],
    freshnessSLA: { maxAgeHours: 24, refreshCadence: "daily" },
    routingTargets: ["comps-engine", "ratio-studies", "calibration"],
  },
  BUILDINGS: {
    type: "BUILDINGS",
    displayName: "Buildings",
    description: "Building characteristics (can be part of roll initially)",
    requiredFields: ["parcel_id", "building_id"],
    optionalFields: [
      "year_built",
      "sq_ft",
      "stories",
      "bedrooms",
      "bathrooms",
      "construction_type",
      "roof_type",
      "condition",
    ],
    validationRules: [
      { field: "parcel_id", rule: "not_empty", severity: "error" },
      { field: "building_id", rule: "not_empty", severity: "error" },
    ],
    freshnessSLA: { maxAgeHours: 168, refreshCadence: "weekly" },
    routingTargets: ["cockpit-map", "comps-engine"],
  },
};

// ============================================
// Validation Types
// ============================================

export interface ValidationRule {
  field: string;
  rule: string;
  severity: "info" | "warning" | "error";
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningCount: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  row?: number;
  field: string;
  rule: string;
  value?: unknown;
  message: string;
}

// ============================================
// Freshness Types
// ============================================

export interface FreshnessSLA {
  maxAgeHours: number;
  refreshCadence: "hourly" | "daily" | "weekly" | "monthly";
}

// ============================================
// Field Mapping Types
// ============================================

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: FieldTransform;
  confidence?: number;
}

export type FieldTransform =
  | { type: "direct" }
  | { type: "uppercase" }
  | { type: "lowercase" }
  | { type: "trim" }
  | { type: "parse_date"; format: string }
  | { type: "parse_number" }
  | { type: "extract"; pattern: string }
  | { type: "concat"; fields: string[]; separator: string }
  | { type: "lookup"; table: string; key: string };

// ============================================
// IDS Dashboard Types
// ============================================

export interface IDSDashboardState {
  selectedCounty: WACountyFips | null;
  activeTab: "inventory" | "ingest" | "quality" | "versions" | "routing" | "audit";
  isLoading: boolean;
  error: string | null;
}

export interface InventoryItem {
  product: DataProductType;
  status: "active" | "stale" | "missing";
  lastUpdated: string | null;
  nextRefresh: string | null;
  recordCount: number;
  coverage: number;
  healthScore: number;
}

export interface RoutingLogEntry {
  timestamp: string;
  product: DataProductType;
  versionId: string;
  subscribers: Array<{
    name: string;
    success: boolean;
    error?: string;
  }>;
}

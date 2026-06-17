/**
 * TerraFusion WA Data Precursor - Core Types
 *
 * This module defines the data foundation for Washington State county integration.
 * Designed for PostgreSQL + PostGIS backend with court-ready audit trails.
 *
 * PRODUCTION NOTES:
 * - All confidence values are 0-100 (not 0-1) for UX consistency
 * - Parcel IDs include both raw and normalized forms for join quality tracking
 * - Geometry stored as PostGIS type in DB, only WKT/GeoJSON in DTOs
 */

// ============================================
// Washington State FIPS County Codes
// ============================================

export const WA_COUNTIES = {
  "53001": { name: "Adams", population: 20000, tier: "rural" },
  "53003": { name: "Asotin", population: 22500, tier: "rural" },
  "53005": { name: "Benton", population: 210000, tier: "urban" },
  "53007": { name: "Chelan", population: 80000, tier: "suburban" },
  "53009": { name: "Clallam", population: 77000, tier: "suburban" },
  "53011": { name: "Clark", population: 510000, tier: "urban" },
  "53013": { name: "Columbia", population: 4000, tier: "rural" },
  "53015": { name: "Cowlitz", population: 110000, tier: "suburban" },
  "53017": { name: "Douglas", population: 44000, tier: "rural" },
  "53019": { name: "Ferry", population: 7500, tier: "rural" },
  "53021": { name: "Franklin", population: 98000, tier: "suburban" },
  "53023": { name: "Garfield", population: 2200, tier: "rural" },
  "53025": { name: "Grant", population: 100000, tier: "suburban" },
  "53027": { name: "Grays Harbor", population: 75000, tier: "suburban" },
  "53029": { name: "Island", population: 87000, tier: "suburban" },
  "53031": { name: "Jefferson", population: 32000, tier: "rural" },
  "53033": { name: "King", population: 2300000, tier: "metro" },
  "53035": { name: "Kitsap", population: 275000, tier: "urban" },
  "53037": { name: "Kittitas", population: 48000, tier: "rural" },
  "53039": { name: "Klickitat", population: 22500, tier: "rural" },
  "53041": { name: "Lewis", population: 82000, tier: "suburban" },
  "53043": { name: "Lincoln", population: 11000, tier: "rural" },
  "53045": { name: "Mason", population: 68000, tier: "suburban" },
  "53047": { name: "Okanogan", population: 42000, tier: "rural" },
  "53049": { name: "Pacific", population: 22000, tier: "rural" },
  "53051": { name: "Pend Oreille", population: 14000, tier: "rural" },
  "53053": { name: "Pierce", population: 930000, tier: "metro" },
  "53055": { name: "San Juan", population: 18000, tier: "rural" },
  "53057": { name: "Skagit", population: 130000, tier: "suburban" },
  "53059": { name: "Skamania", population: 12500, tier: "rural" },
  "53061": { name: "Snohomish", population: 830000, tier: "metro" },
  "53063": { name: "Spokane", population: 540000, tier: "urban" },
  "53065": { name: "Stevens", population: 46000, tier: "rural" },
  "53067": { name: "Thurston", population: 295000, tier: "urban" },
  "53069": { name: "Wahkiakum", population: 4500, tier: "rural" },
  "53071": { name: "Walla Walla", population: 62000, tier: "suburban" },
  "53073": { name: "Whatcom", population: 230000, tier: "urban" },
  "53075": { name: "Whitman", population: 50000, tier: "suburban" },
  "53077": { name: "Yakima", population: 260000, tier: "urban" },
} as const;

export type WACountyFips = keyof typeof WA_COUNTIES;
export type CountyTier = "rural" | "suburban" | "urban" | "metro";

// ============================================
// Join Quality Tracking (Critical for data integrity)
// ============================================

export type JoinConfidence = "high" | "med" | "low";
export type JoinMethod = "exact" | "normalized" | "fuzzy" | "manual" | "unjoined";

/**
 * Normalizes a parcel ID for consistent joins across data sources.
 * Strips punctuation, pads numeric portions, uppercases.
 */
export function normalizeParcelId(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^0+/, ""); // Remove leading zeros for comparison
}

// ============================================
// Parcel Base Layer (WA Statewide) - DTO for API transfer
// ============================================

export interface ParcelBaseWA_Dto {
  parcel_uid: string; // Stable internal key (UUID)
  county_fips: WACountyFips; // WA county FIPS code
  original_parcel_id: string; // Original APN/PARID from source
  geom_wkt?: string; // WKT geometry (for transfer only)
  geom_geojson?: GeoJSON.Geometry; // GeoJSON geometry (for transfer only)
  centroid_lat?: number;
  centroid_lng?: number;
  acreage?: number;
  source_version: string; // e.g., "WA_Parcels_2025_Sept"
  ingested_at: string; // ISO timestamp
}

// Alias for backwards compatibility
export type ParcelBaseWA = ParcelBaseWA_Dto;

// ============================================
// County Parcel Roll (County Enrichment)
// ============================================

export interface CountyParcelRoll {
  id: string;
  county_fips: WACountyFips;

  // Parcel ID with normalization for join quality
  county_parcel_id_raw: string; // Original APN/PARID exactly as received
  county_parcel_id_norm: string; // Normalized (strip punctuation, pad, uppercase)
  parcel_uid?: string; // Link to WA base layer
  join_confidence?: JoinConfidence; // How confident the join is
  join_method?: JoinMethod; // How the join was established

  // Situs (Property Address)
  situs_address?: string;
  situs_city?: string;
  situs_zip?: string;

  // Classification
  property_class?: string; // e.g., "R1", "C2", "A1"
  property_class_desc?: string; // "Single Family Residential"
  land_use_code?: string;
  zoning?: string;

  // Valuation
  land_value?: number;
  improvement_value?: number;
  total_value?: number;
  taxable_value?: number;

  // Building Info
  year_built?: number;
  building_sqft?: number;
  lot_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;

  // Roll Metadata
  roll_year: number;
  effective_date?: string;
  certified_date?: string;

  // Change Detection
  hash_row: string; // SHA256 of key fields for delta detection
  updated_at: string;
}

// ============================================
// Sales Records
// ============================================

export interface SaleRecord {
  id: string;
  county_fips: WACountyFips;

  // Parcel ID with normalization for join quality
  county_parcel_id_raw: string;
  county_parcel_id_norm: string;
  parcel_uid?: string;
  join_confidence?: JoinConfidence;
  join_method?: JoinMethod;

  sale_date: string;
  sale_price: number;

  // Sale Validity
  is_arms_length: boolean;
  validity_code?: string; // County-specific validity codes
  validity_reason?: string;

  // Transaction Details
  instrument_number?: string;
  document_type?: string; // "Warranty Deed", "Quit Claim", etc.
  grantor?: string;
  grantee?: string;

  // For Ratio Studies
  assessed_value_at_sale?: number;
  sale_ratio?: number; // assessed / sale price

  ingested_at: string;
}

// ============================================
// Ingest Runs & Lineage (Court-Ready Audit)
// ============================================

export type IngestSource =
  | "wa_statewide_parcels"
  | "county_file_upload"
  | "county_api_pull"
  | "arcgis_feature_service"
  | "sftp_scheduled"
  | "manual_entry";

export type IngestStatus =
  | "pending"
  | "fingerprinting"
  | "mapping"
  | "validating"
  | "importing"
  | "ready"
  | "completed"
  | "published"
  | "failed"
  | "rolled_back";

export interface IngestRun {
  id: string;
  county_fips: WACountyFips;
  source?: IngestSource;
  source_url?: string;
  source_filename?: string;
  source_fingerprint?: string; // SHA256 of file/response for audit
  transform_version?: string; // Mapping ruleset ID, e.g., "mapping-template-v3"

  status: IngestStatus;
  started_at: string;
  completed_at?: string;

  // Row Metrics (overall)
  rows_received?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_skipped?: number;
  rows_errored?: number;

  // Row Counts by Stage (for pipeline debugging)
  row_counts_by_stage?: {
    raw?: number;
    mapped?: number;
    valid?: number;
    validated?: number;
    published?: number;
  };

  // Error/Warning Summaries
  errors_top?: Array<{ message: string; count: number }>;
  warnings_top?: Array<{ message: string; count: number }>;

  // Extended pipeline fields
  product_type?: string;
  source_type?: "file" | "connected-feed" | "wa-fabric";
  field_mappings?: Record<string, string>;
  error_message?: string;
  fingerprint_detected?: string;
  fingerprint_confidence?: number;
  validation_result?: unknown;
  published_at?: string;
  version_id?: string;
  second_approver?: string;

  // Audit
  initiated_by?: string; // User ID or "system"
  approved_by?: string; // For dual-approval workflows
  change_memo?: string;

  // Rollback Support
  snapshot_id?: string; // Reference to pre-ingest snapshot
  can_rollback?: boolean;
}

export interface LineageEvent {
  id: string;
  ingest_run_id?: string;
  event_type: "info" | "warning" | "error" | "validation" | "transform" | "published" | "rollback";
  timestamp: string;
  message?: string;
  details?: Record<string, unknown>;
  affected_rows?: number;
  county_fips?: WACountyFips;
  product_type?: string;
  version_id?: string;
  actor?: string;
}

// ============================================
// County Onboarding State
// ============================================

export type OnboardingPath =
  | "public_quickstart" // WA baseline only, add roll later
  | "file_drop" // Upload CSV/DBF/GDB
  | "connected_feed" // ArcGIS/SFTP/API
  | "quick-start"; // Alias used in repository

export type DataLayerStatus =
  | "not_configured"
  | "not_started"
  | "pending"
  | "validating"
  | "active"
  | "stale"
  | "error";

export interface CountyDataStatus {
  county_fips: WACountyFips;
  county_name: string;

  // Layer Status with enhanced metadata
  parcel_fabric: {
    status: DataLayerStatus;
    source: "wa_statewide" | "county_provided" | "none" | "wa_geo_portal";
    parcel_count?: number;
    last_updated?: string;
    last_sync?: string;
    next_refresh_at?: string;
    stale_reason?: string;
    coverage_pct?: number;
  };

  county_roll: {
    status: DataLayerStatus;
    roll_year?: number;
    record_count?: number;
    total_records?: number;
    join_rate_pct?: number;
    certified_at?: string;
    last_updated?: string;
    last_sync?: string;
    next_refresh_at?: string;
    stale_reason?: string;
    mapping_confidence_pct?: number;
  };

  sales_stream: {
    status: DataLayerStatus;
    record_count?: number;
    total_sales?: number;
    valid_sales?: number;
    date_range?: { from: string; to: string };
    date_range_start?: string;
    date_range_end?: string;
    last_updated?: string;
    last_sync?: string;
    next_refresh_at?: string;
    stale_reason?: string;
    arms_length_pct?: number;
  };

  // Onboarding
  onboarding_path?: OnboardingPath;
  onboarding_completed_at?: string;

  // Summary fields
  overall_readiness_pct?: number;
  capabilities_unlocked?: string[];
  last_updated?: string;

  // Capabilities Unlocked (computed from layer status, not stored)
  capabilities?: {
    cockpit_map: boolean;
    ratio_studies: boolean;
    comps_selection: boolean;
    model_calibration: boolean;
    appeals_support: boolean;
  };
}

// ============================================
// AI Field Mapping Memory (Learning Log)
// ============================================

export interface FieldMappingMemory {
  id: string;
  county_fips: WACountyFips;
  source_field: string; // Original column name from county
  target_field: string; // TerraFusion canonical field
  confidence_pct: number; // 0-100 (NORMALIZED for UX)
  learned_at: string;
  used_count: number; // How many times this mapping was used
  last_used_at: string;
  source_fingerprint?: string; // Which file/export this was learned from
}

// ============================================
// County Export Fingerprint Templates (AI Power Feature)
// ============================================

export type VendorSystem =
  | "Tyler"
  | "Tyler Technologies"
  | "Schneider"
  | "Schneider Geospatial"
  | "Catalis"
  | "Thomson Reuters"
  | "DEVNET"
  | "Custom"
  | "Unknown";

export interface CountyExportFingerprint {
  id?: string;
  vendor?: VendorSystem;
  product?: string;
  county_fips?: WACountyFips;
  template_name?: string;
  detected_fields?: string[];
  suggested_mappings?: Record<string, string>;
  signature?: {
    columns: string[];
    key_fields_present: string[];
    sample_patterns?: Record<string, string>;
  };
  recommended_template_id?: string;
  confidence_pct: number; // 0-100
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Connected Feed Configuration
// ============================================

export type FeedType =
  | "arcgis_feature_service"
  | "arcgis_hub"
  | "sftp"
  | "https_download"
  | "api_rest";

export type FeedSchedule = "realtime" | "hourly" | "daily" | "weekly" | "monthly" | "on_demand";

export interface ConnectedFeed {
  id: string;
  county_fips: WACountyFips;
  name: string;
  feed_type: FeedType;

  // Connection Details
  endpoint_url: string;
  auth_type?: "none" | "api_key" | "oauth" | "basic";
  // Credentials stored separately in secure vault

  // Schedule
  schedule: FeedSchedule;
  last_pull_at?: string;
  next_pull_at?: string;

  // Data Mapping (simple config, not full memory objects)
  target_layer: "parcel" | "roll" | "sales" | "building";
  field_mappings: Record<string, string>; // { sourceField: targetField }
  mapping_template_id?: string; // Reference to learning template

  // Status
  is_active: boolean;
  last_status: "success" | "partial" | "failed";
  error_message?: string;
}

// ============================================
// Roll Versioning (Time Travel)
// ============================================

export interface RollVersion {
  id: string;
  county_fips: WACountyFips;
  roll_year: number;
  version_type: "certified" | "revision" | "preliminary" | "working";
  version_number: number; // e.g., revision 1, 2, 3...

  record_count: number;
  created_at: string;
  created_by: string;

  // For certified rolls
  certification_date?: string;
  certification_authority?: string;

  // Change Summary
  changes_from_previous?: {
    records_added: number;
    records_modified: number;
    records_deleted: number;
    total_value_change: number;
  };

  // Snapshot Reference
  snapshot_table?: string; // e.g., "roll_2026_certified_v1"
}

// ============================================
// Security & AI Mode Configuration
// ============================================

export type AIMode =
  | "sovereign_cloud" // Azure Gov OpenAI
  | "on_prem" // County-hosted AI
  | "hybrid" // Metadata to cloud, rows stay local
  | "disabled"; // No AI features

export interface CountySecurityConfig {
  county_fips: WACountyFips;

  // Data Residency
  data_residency: "azure_gov" | "county_hosted" | "hybrid";

  // AI Configuration
  ai_mode: AIMode;
  ai_allowed_operations?: string[]; // e.g., ["field_mapping", "anomaly_detection"]

  // Access Control
  require_dual_approval: boolean;
  require_mfa: boolean;
  session_timeout_minutes: number;

  // Audit
  audit_retention_days: number;
  require_change_memo: boolean;
}

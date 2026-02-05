/**
 * TerraFusion WA Data Client
 * 
 * Demo client for Washington State data operations.
 * In production, this would connect to PostgreSQL + PostGIS.
 */

import {
  WA_COUNTIES,
  type WACountyFips,
  type CountyDataStatus,
  type IngestRun,
  type OnboardingPath,
  type DataLayerStatus,
  type RollVersion,
  type ConnectedFeed,
} from "./types";

// Simulated delay for demo
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// County Data Status
// ============================================

// In-memory store for demo (would be PostgreSQL in production)
const countyStatusStore = new Map<WACountyFips, CountyDataStatus>();

export async function getCountyDataStatus(fips: WACountyFips): Promise<CountyDataStatus> {
  await delay(100);
  
  if (countyStatusStore.has(fips)) {
    return countyStatusStore.get(fips)!;
  }
  
  // Default status for new county
  const county = WA_COUNTIES[fips];
  const defaultStatus: CountyDataStatus = {
    county_fips: fips,
    county_name: county?.name || "Unknown",
    parcel_fabric: {
      status: "not_configured",
      source: "none",
    },
    county_roll: {
      status: "not_configured",
    },
    sales_stream: {
      status: "not_configured",
    },
    capabilities: {
      cockpit_map: false,
      ratio_studies: false,
      comps_selection: false,
      model_calibration: false,
      appeals_support: false,
    },
  };
  
  return defaultStatus;
}

export async function getAllCountyStatuses(): Promise<CountyDataStatus[]> {
  await delay(200);
  
  const statuses: CountyDataStatus[] = [];
  
  for (const [fips, county] of Object.entries(WA_COUNTIES)) {
    const status = countyStatusStore.get(fips as WACountyFips) || {
      county_fips: fips as WACountyFips,
      county_name: county.name,
      parcel_fabric: { status: "not_configured" as DataLayerStatus, source: "none" as const },
      county_roll: { status: "not_configured" as DataLayerStatus },
      sales_stream: { status: "not_configured" as DataLayerStatus },
      capabilities: {
        cockpit_map: false,
        ratio_studies: false,
        comps_selection: false,
        model_calibration: false,
        appeals_support: false,
      },
    };
    statuses.push(status);
  }
  
  return statuses;
}

// ============================================
// WA Statewide Parcel Fabric
// ============================================

export async function loadWAParcelFabric(fips: WACountyFips): Promise<{
  parcelCount: number;
  coveragePct: number;
  sourceVersion: string;
}> {
  await delay(1500); // Simulate loading from WA Geo Portal
  
  const county = WA_COUNTIES[fips];
  
  // Simulate parcel counts based on county population
  const parcelCount = Math.floor((county?.population || 50000) * 0.4);
  
  // Update county status
  const currentStatus = await getCountyDataStatus(fips);
  const updatedStatus: CountyDataStatus = {
    ...currentStatus,
    parcel_fabric: {
      status: "active",
      source: "wa_statewide",
      parcel_count: parcelCount,
      last_updated: new Date().toISOString(),
      coverage_pct: 98.5,
    },
    capabilities: {
      ...currentStatus.capabilities,
      cockpit_map: true,
    },
  };
  
  countyStatusStore.set(fips, updatedStatus);
  
  return {
    parcelCount,
    coveragePct: 98.5,
    sourceVersion: "WA_Parcels_2025_Sept",
  };
}

// ============================================
// County Onboarding
// ============================================

export async function startOnboarding(
  fips: WACountyFips,
  path: OnboardingPath
): Promise<{ success: boolean; message: string }> {
  await delay(500);
  
  const currentStatus = await getCountyDataStatus(fips);
  
  const updatedStatus: CountyDataStatus = {
    ...currentStatus,
    onboarding_path: path,
  };
  
  countyStatusStore.set(fips, updatedStatus);
  
  return {
    success: true,
    message: `Onboarding started via ${path} path`,
  };
}

export async function completeOnboarding(fips: WACountyFips): Promise<void> {
  await delay(300);
  
  const currentStatus = await getCountyDataStatus(fips);
  
  const updatedStatus: CountyDataStatus = {
    ...currentStatus,
    onboarding_completed_at: new Date().toISOString(),
  };
  
  countyStatusStore.set(fips, updatedStatus);
}

// ============================================
// County Roll Attachment
// ============================================

export async function attachCountyRoll(
  fips: WACountyFips,
  rollYear: number,
  recordCount: number,
  mappingConfidence: number
): Promise<IngestRun> {
  await delay(800);
  
  const currentStatus = await getCountyDataStatus(fips);
  
  const updatedStatus: CountyDataStatus = {
    ...currentStatus,
    county_roll: {
      status: "active",
      roll_year: rollYear,
      record_count: recordCount,
      last_updated: new Date().toISOString(),
      mapping_confidence: mappingConfidence,
    },
    capabilities: {
      ...currentStatus.capabilities,
      cockpit_map: true,
      comps_selection: true,
    },
  };
  
  countyStatusStore.set(fips, updatedStatus);
  
  return {
    id: `ingest-${Date.now()}`,
    county_fips: fips,
    source: "county_file_upload",
    status: "completed",
    started_at: new Date(Date.now() - 5000).toISOString(),
    completed_at: new Date().toISOString(),
    rows_received: recordCount,
    rows_inserted: recordCount,
    rows_updated: 0,
    rows_skipped: 0,
    rows_errored: 0,
    initiated_by: "demo_user",
    can_rollback: true,
  };
}

// ============================================
// Sales Stream
// ============================================

export async function attachSalesStream(
  fips: WACountyFips,
  recordCount: number,
  dateRange: { from: string; to: string }
): Promise<IngestRun> {
  await delay(600);
  
  const currentStatus = await getCountyDataStatus(fips);
  
  const updatedStatus: CountyDataStatus = {
    ...currentStatus,
    sales_stream: {
      status: "active",
      record_count: recordCount,
      date_range: dateRange,
      last_updated: new Date().toISOString(),
      arms_length_pct: 85,
    },
    capabilities: {
      ...currentStatus.capabilities,
      ratio_studies: true,
      comps_selection: true,
      model_calibration: currentStatus.county_roll.status === "active",
    },
  };
  
  countyStatusStore.set(fips, updatedStatus);
  
  return {
    id: `ingest-${Date.now()}`,
    county_fips: fips,
    source: "county_file_upload",
    status: "completed",
    started_at: new Date(Date.now() - 3000).toISOString(),
    completed_at: new Date().toISOString(),
    rows_received: recordCount,
    rows_inserted: recordCount,
    rows_updated: 0,
    rows_skipped: 0,
    rows_errored: 0,
    initiated_by: "demo_user",
    can_rollback: true,
  };
}

// ============================================
// Roll Versioning
// ============================================

export async function getRollVersions(fips: WACountyFips): Promise<RollVersion[]> {
  await delay(200);
  
  // Demo data - would come from PostgreSQL in production
  return [
    {
      id: "rv-001",
      county_fips: fips,
      roll_year: 2026,
      version_type: "certified",
      version_number: 1,
      record_count: 45000,
      created_at: "2026-01-15T00:00:00Z",
      created_by: "system",
      certification_date: "2026-01-15T00:00:00Z",
      certification_authority: "County Assessor",
    },
    {
      id: "rv-002",
      county_fips: fips,
      roll_year: 2025,
      version_type: "certified",
      version_number: 1,
      record_count: 44200,
      created_at: "2025-01-15T00:00:00Z",
      created_by: "system",
      certification_date: "2025-01-15T00:00:00Z",
      certification_authority: "County Assessor",
      changes_from_previous: {
        records_added: 800,
        records_modified: 12500,
        records_deleted: 50,
        total_value_change: 125000000,
      },
    },
  ];
}

// ============================================
// Connected Feeds
// ============================================

export async function getConnectedFeeds(fips: WACountyFips): Promise<ConnectedFeed[]> {
  await delay(200);
  
  // Demo data - would come from PostgreSQL in production
  return [];
}

export async function createConnectedFeed(feed: Omit<ConnectedFeed, "id">): Promise<ConnectedFeed> {
  await delay(500);
  
  return {
    ...feed,
    id: `feed-${Date.now()}`,
  };
}

// ============================================
// Capability Check Helpers
// ============================================

export function checkCapabilities(status: CountyDataStatus): {
  ready: string[];
  pending: string[];
  blocked: string[];
} {
  const ready: string[] = [];
  const pending: string[] = [];
  const blocked: string[] = [];
  
  // Cockpit Map requires parcel fabric
  if (status.parcel_fabric.status === "active") {
    ready.push("Quantum Cockpit Map");
  } else if (status.parcel_fabric.status === "pending" || status.parcel_fabric.status === "validating") {
    pending.push("Quantum Cockpit Map");
  } else {
    blocked.push("Quantum Cockpit Map - needs parcel fabric");
  }
  
  // Ratio Studies requires sales + roll
  if (status.sales_stream.status === "active" && status.county_roll.status === "active") {
    ready.push("Ratio Studies");
  } else if (status.sales_stream.status === "active" || status.county_roll.status === "active") {
    pending.push("Ratio Studies - needs both sales and roll data");
  } else {
    blocked.push("Ratio Studies - needs sales and roll data");
  }
  
  // Comps Selection requires sales
  if (status.sales_stream.status === "active") {
    ready.push("Comparable Sales Selection");
  } else {
    blocked.push("Comparable Sales Selection - needs sales data");
  }
  
  // Model Calibration requires all three
  if (
    status.parcel_fabric.status === "active" &&
    status.county_roll.status === "active" &&
    status.sales_stream.status === "active"
  ) {
    ready.push("Model Calibration Studio");
    ready.push("Appeals Support");
  } else {
    pending.push("Model Calibration Studio - needs all data layers");
    pending.push("Appeals Support - needs all data layers");
  }
  
  return { ready, pending, blocked };
}

// ============================================
// Demo: Initialize Some Counties
// ============================================

export async function initializeDemoCounties(): Promise<void> {
  // Pre-populate Benton County as fully configured
  const bentonStatus: CountyDataStatus = {
    county_fips: "53005",
    county_name: "Benton",
    parcel_fabric: {
      status: "active",
      source: "wa_statewide",
      parcel_count: 84000,
      last_updated: "2025-09-15T00:00:00Z",
      coverage_pct: 99.2,
    },
    county_roll: {
      status: "active",
      roll_year: 2026,
      record_count: 84000,
      last_updated: "2026-01-15T00:00:00Z",
      mapping_confidence: 98,
    },
    sales_stream: {
      status: "active",
      record_count: 12500,
      date_range: { from: "2023-01-01", to: "2025-12-31" },
      last_updated: "2026-01-20T00:00:00Z",
      arms_length_pct: 87,
    },
    onboarding_path: "file_drop",
    onboarding_completed_at: "2026-01-01T00:00:00Z",
    capabilities: {
      cockpit_map: true,
      ratio_studies: true,
      comps_selection: true,
      model_calibration: true,
      appeals_support: true,
    },
  };
  
  countyStatusStore.set("53005", bentonStatus);
  
  // King County - partial (only fabric)
  const kingStatus: CountyDataStatus = {
    county_fips: "53033",
    county_name: "King",
    parcel_fabric: {
      status: "active",
      source: "wa_statewide",
      parcel_count: 920000,
      last_updated: "2025-09-15T00:00:00Z",
      coverage_pct: 97.8,
    },
    county_roll: {
      status: "not_configured",
    },
    sales_stream: {
      status: "not_configured",
    },
    onboarding_path: "public_quickstart",
    capabilities: {
      cockpit_map: true,
      ratio_studies: false,
      comps_selection: false,
      model_calibration: false,
      appeals_support: false,
    },
  };
  
  countyStatusStore.set("53033", kingStatus);
}

/**
 * DataSuite Repository
 * 
 * Abstracts data storage. Demo uses in-memory Map, production uses Postgres.
 * 
 * Responsibilities:
 * - saveIngestRun / updateIngestRun / getIngestRun
 * - writeProductVersion / getVersions
 * - getLatestStatus / updateStatus
 * - saveLineageEvent / getLineageEvents
 */

import type {
  WACountyFips,
  DataProductType,
  IngestRun,
  CountyDataStatus,
  LineageEvent,
} from "./types";
import type { ProductVersion } from "./hub";

// ============================================
// Repository Interface
// ============================================

export interface IDataSuiteRepository {
  // Ingest Runs
  createIngestRun(data: Partial<IngestRun>): Promise<IngestRun>;
  updateIngestRun(id: string, data: Partial<IngestRun>): Promise<IngestRun>;
  getIngestRun(id: string): Promise<IngestRun | null>;
  getIngestRunsForCounty(countyFips: WACountyFips, limit?: number): Promise<IngestRun[]>;

  // County Status
  getCountyStatus(countyFips: WACountyFips): Promise<CountyDataStatus | null>;
  updateCountyStatus(countyFips: WACountyFips, status: Partial<CountyDataStatus>): Promise<CountyDataStatus>;

  // Versions
  createVersion(countyFips: WACountyFips, product: DataProductType, version: ProductVersion): Promise<ProductVersion>;
  getVersions(countyFips: WACountyFips, product: DataProductType, limit?: number): Promise<ProductVersion[]>;
  getCurrentVersion(countyFips: WACountyFips, product: DataProductType): Promise<ProductVersion | null>;

  // Lineage Events
  createLineageEvent(event: LineageEvent): Promise<LineageEvent>;
  getLineageEvents(countyFips: WACountyFips, product?: DataProductType, limit?: number): Promise<LineageEvent[]>;
}

// ============================================
// Demo In-Memory Implementation
// ============================================

class DemoRepository implements IDataSuiteRepository {
  private ingestRuns = new Map<string, IngestRun>();
  private countyStatuses = new Map<WACountyFips, CountyDataStatus>();
  private versions = new Map<string, ProductVersion[]>(); // key: `${countyFips}:${product}`
  private lineageEvents = new Map<string, LineageEvent[]>(); // key: countyFips

  // ----------------------------------------
  // Ingest Runs
  // ----------------------------------------

  async createIngestRun(data: Partial<IngestRun>): Promise<IngestRun> {
    const id = `ir-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const run: IngestRun = {
      id,
      county_fips: data.county_fips!,
      product_type: data.product_type!,
      source_type: data.source_type || "file",
      started_at: data.started_at || new Date().toISOString(),
      status: data.status || "pending",
      row_counts_by_stage: data.row_counts_by_stage || { raw: 0, valid: 0, published: 0 },
    };
    this.ingestRuns.set(id, run);
    return run;
  }

  async updateIngestRun(id: string, data: Partial<IngestRun>): Promise<IngestRun> {
    const existing = this.ingestRuns.get(id);
    if (!existing) throw new Error(`Ingest run not found: ${id}`);

    const updated = { ...existing, ...data };
    this.ingestRuns.set(id, updated);
    return updated;
  }

  async getIngestRun(id: string): Promise<IngestRun | null> {
    return this.ingestRuns.get(id) || null;
  }

  async getIngestRunsForCounty(countyFips: WACountyFips, limit = 20): Promise<IngestRun[]> {
    return Array.from(this.ingestRuns.values())
      .filter((r) => r.county_fips === countyFips)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, limit);
  }

  // ----------------------------------------
  // County Status
  // ----------------------------------------

  async getCountyStatus(countyFips: WACountyFips): Promise<CountyDataStatus | null> {
    return this.countyStatuses.get(countyFips) || null;
  }

  async updateCountyStatus(
    countyFips: WACountyFips,
    status: Partial<CountyDataStatus>
  ): Promise<CountyDataStatus> {
    const existing = this.countyStatuses.get(countyFips);
    const updated: CountyDataStatus = {
      county_fips: countyFips,
      county_name: status.county_name || existing?.county_name || "Unknown",
      onboarding_path: status.onboarding_path || existing?.onboarding_path || "quick-start",
      overall_readiness_pct: status.overall_readiness_pct ?? existing?.overall_readiness_pct ?? 0,
      parcel_fabric: status.parcel_fabric || existing?.parcel_fabric || {
        status: "not_started",
        source: "wa_geo_portal",
        coverage_pct: 0,
      },
      county_roll: status.county_roll || existing?.county_roll || {
        status: "not_started",
        join_rate_pct: 0,
        total_records: 0,
      },
      sales_stream: status.sales_stream || existing?.sales_stream || {
        status: "not_started",
        total_sales: 0,
        valid_sales: 0,
        arms_length_pct: 0,
      },
      capabilities_unlocked: status.capabilities_unlocked || existing?.capabilities_unlocked || [],
      last_updated: new Date().toISOString(),
    };

    this.countyStatuses.set(countyFips, updated);
    return updated;
  }

  // ----------------------------------------
  // Versions
  // ----------------------------------------

  async createVersion(
    countyFips: WACountyFips,
    product: DataProductType,
    version: ProductVersion
  ): Promise<ProductVersion> {
    const key = `${countyFips}:${product}`;
    const existing = this.versions.get(key) || [];

    // Mark all as not current
    for (const v of existing) {
      v.is_current = false;
    }

    version.is_current = true;
    existing.unshift(version);
    this.versions.set(key, existing);

    return version;
  }

  async getVersions(
    countyFips: WACountyFips,
    product: DataProductType,
    limit = 10
  ): Promise<ProductVersion[]> {
    const key = `${countyFips}:${product}`;
    return (this.versions.get(key) || []).slice(0, limit);
  }

  async getCurrentVersion(
    countyFips: WACountyFips,
    product: DataProductType
  ): Promise<ProductVersion | null> {
    const key = `${countyFips}:${product}`;
    const versions = this.versions.get(key) || [];
    return versions.find((v) => v.is_current) || null;
  }

  // ----------------------------------------
  // Lineage Events
  // ----------------------------------------

  async createLineageEvent(event: LineageEvent): Promise<LineageEvent> {
    const existing = this.lineageEvents.get(event.county_fips) || [];
    existing.unshift(event);
    this.lineageEvents.set(event.county_fips, existing);
    return event;
  }

  async getLineageEvents(
    countyFips: WACountyFips,
    product?: DataProductType,
    limit = 50
  ): Promise<LineageEvent[]> {
    let events = this.lineageEvents.get(countyFips) || [];
    if (product) {
      events = events.filter((e) => e.product_type === product);
    }
    return events.slice(0, limit);
  }

  // ----------------------------------------
  // Demo Helpers
  // ----------------------------------------

  /**
   * Initialize demo data for a county
   */
  async initializeDemoCounty(countyFips: WACountyFips, countyName: string): Promise<void> {
    await this.updateCountyStatus(countyFips, {
      county_name: countyName,
      onboarding_path: "quick-start",
      overall_readiness_pct: 75,
      parcel_fabric: {
        status: "active",
        source: "wa_geo_portal",
        parcel_count: 45000 + Math.floor(Math.random() * 10000),
        coverage_pct: 100,
        last_sync: new Date().toISOString(),
        next_refresh_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      county_roll: {
        status: "active",
        roll_year: 2026,
        certified_at: new Date().toISOString(),
        total_records: 42000 + Math.floor(Math.random() * 8000),
        join_rate_pct: 94 + Math.random() * 5,
        last_sync: new Date().toISOString(),
        next_refresh_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      sales_stream: {
        status: "active",
        total_sales: 2500 + Math.floor(Math.random() * 500),
        valid_sales: 2200 + Math.floor(Math.random() * 300),
        arms_length_pct: 78 + Math.random() * 15,
        date_range_start: "2023-01-01",
        date_range_end: "2025-12-31",
        last_sync: new Date().toISOString(),
        next_refresh_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      capabilities_unlocked: [
        "cockpit_map",
        "ratio_studies",
        "comps_selection",
        "model_calibration",
      ],
    });

    // Add some demo versions
    await this.createVersion(countyFips, "COUNTY_ROLL", {
      id: `v-${Date.now() - 86400000}`,
      version_label: "2026 Certified v1",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      row_count: 42500,
      approved_by: "jane.assessor@county.gov",
      is_current: false,
      change_summary: {
        rows_added: 42500,
        rows_modified: 0,
        rows_removed: 0,
      },
    });

    await this.createVersion(countyFips, "COUNTY_ROLL", {
      id: `v-${Date.now()}`,
      version_label: "2026 Certified v2",
      created_at: new Date().toISOString(),
      row_count: 42800,
      approved_by: "jane.assessor@county.gov",
      is_current: true,
      change_summary: {
        rows_added: 350,
        rows_modified: 125,
        rows_removed: 50,
        value_delta: 12500000,
      },
    });

    // Add demo lineage events
    await this.createLineageEvent({
      id: `le-${Date.now() - 86400000}`,
      county_fips: countyFips,
      product_type: "COUNTY_ROLL",
      event_type: "published",
      version_id: `v-${Date.now() - 86400000}`,
      actor: "jane.assessor@county.gov",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      details: { versionLabel: "2026 Certified v1" },
    });

    await this.createLineageEvent({
      id: `le-${Date.now()}`,
      county_fips: countyFips,
      product_type: "COUNTY_ROLL",
      event_type: "published",
      version_id: `v-${Date.now()}`,
      actor: "jane.assessor@county.gov",
      timestamp: new Date().toISOString(),
      details: { versionLabel: "2026 Certified v2" },
    });
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.ingestRuns.clear();
    this.countyStatuses.clear();
    this.versions.clear();
    this.lineageEvents.clear();
  }
}

// Singleton instance
export const repository = new DemoRepository();

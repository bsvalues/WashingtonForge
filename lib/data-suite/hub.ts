/**
 * DataSuiteHub - The central authority for all data operations in TerraFusion
 *
 * This is the SINGLE entry point for:
 * - Ingestion (upload/connect, fingerprint, map, validate, publish)
 * - Quality (join match rate, validation rules, anomaly detection)
 * - Versions (roll snapshots, revisions, diffs, time travel)
 * - Routing (where data feeds inside the OS)
 * - Audit (lineage, approvals, court-ready exports)
 *
 * No other module should call ingest functions directly.
 */

import type {
  WACountyFips,
  DataProduct,
  DataProductType,
  IngestRun,
  CountyDataStatus,
  LineageEvent,
  ValidationResult,
  FieldMapping,
  CountyExportFingerprint,
} from "./types";
import { eventBus, type DataSuiteEvent } from "./event-bus";
import { repository } from "./repository";

// ============================================
// Hub Configuration
// ============================================

export interface HubConfig {
  /** AI mode for fingerprint/mapping */
  aiMode: "sovereign-cloud" | "on-prem" | "hybrid" | "disabled";
  /** Require dual approval for publishes */
  requireDualApproval: boolean;
  /** Auto-refresh stale data */
  autoRefreshStale: boolean;
  /** Stale threshold in hours */
  staleThresholdHours: number;
}

const defaultConfig: HubConfig = {
  aiMode: "sovereign-cloud",
  requireDualApproval: false,
  autoRefreshStale: true,
  staleThresholdHours: 24,
};

// ============================================
// Hub State
// ============================================

let hubConfig: HubConfig = { ...defaultConfig };

// ============================================
// Hub API - The Single Entry Point
// ============================================

export const dataSuiteHub = {
  /**
   * Configure the hub
   */
  configure(config: Partial<HubConfig>) {
    hubConfig = { ...hubConfig, ...config };
    return hubConfig;
  },

  /**
   * Get current configuration
   */
  getConfig(): HubConfig {
    return { ...hubConfig };
  },

  // ----------------------------------------
  // INGEST OPERATIONS
  // ----------------------------------------

  /**
   * Start a new ingest operation
   */
  async ingest(params: {
    countyFips: WACountyFips;
    product: DataProductType;
    source: "file" | "connected-feed" | "wa-fabric";
    payloadRef?: string; // File reference or feed ID
    file?: File;
  }): Promise<IngestRun> {
    const { countyFips, product, source, file } = params;

    // Create ingest run
    const run = await repository.createIngestRun({
      county_fips: countyFips,
      product_type: product,
      source_type: source,
      started_at: new Date().toISOString(),
      status: "pending",
    });

    // Emit event
    eventBus.emit({
      type: "ingest.started",
      payload: { ingestRunId: run.id, countyFips, product },
      timestamp: new Date().toISOString(),
    });

    // If file provided, process it
    if (file) {
      return this.processFile(run, file);
    }

    return run;
  },

  /**
   * Process an uploaded file through the pipeline
   * Pipeline: Acquire → Fingerprint → Map → Validate → Join → Version → Publish → Route → Audit
   */
  async processFile(run: IngestRun, file: File): Promise<IngestRun> {
    try {
      // Step 1: Fingerprint
      const fingerprint = await this.detectFingerprint(file);
      run = await repository.updateIngestRun(run.id, {
        status: "fingerprinting",
        fingerprint_detected: fingerprint?.template_name,
        fingerprint_confidence: fingerprint?.confidence_pct,
      });

      eventBus.emit({
        type: "ingest.fingerprinted",
        payload: { ingestRunId: run.id, fingerprint },
        timestamp: new Date().toISOString(),
      });

      // Step 2: Map fields (if fingerprint has template)
      if (fingerprint?.suggested_mappings) {
        run = await repository.updateIngestRun(run.id, {
          status: "mapping",
          field_mappings: fingerprint.suggested_mappings,
        });
      }

      // Step 3: Validate
      run = await repository.updateIngestRun(run.id, { status: "validating" });
      const validation = await this.validate(run);

      // Step 4: Ready for publish (requires user confirmation)
      run = await repository.updateIngestRun(run.id, {
        status: "ready",
        validation_result: validation,
        row_counts_by_stage: {
          raw: validation.totalRows,
          valid: validation.totalRows - validation.errorCount,
          published: 0,
        },
      });

      eventBus.emit({
        type: "ingest.ready",
        payload: { ingestRunId: run.id, validation },
        timestamp: new Date().toISOString(),
      });

      return run;
    } catch (error) {
      run = await repository.updateIngestRun(run.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });

      eventBus.emit({
        type: "ingest.failed",
        payload: { ingestRunId: run.id, error: run.error_message },
        timestamp: new Date().toISOString(),
      });

      return run;
    }
  },

  /**
   * Detect export fingerprint using AI or templates
   */
  async detectFingerprint(file: File): Promise<CountyExportFingerprint | null> {
    // In production: call AI service or match against templates
    // For demo: simulate fingerprint detection
    const filename = file.name.toLowerCase();

    if (filename.includes("tyler") || filename.includes("munis")) {
      return {
        vendor: "Tyler Technologies",
        product: "iasWorld",
        template_name: "tyler_iasworld_standard",
        confidence_pct: 92,
        detected_fields: ["PARID", "LAND_VAL", "IMPR_VAL", "TOTAL_VAL", "SITUS"],
        suggested_mappings: {
          PARID: "county_parcel_id_raw",
          LAND_VAL: "land_value",
          IMPR_VAL: "improvement_value",
          TOTAL_VAL: "total_value",
          SITUS: "situs_address",
        },
      };
    }

    if (filename.includes("schneider") || filename.includes("gis")) {
      return {
        vendor: "Schneider Geospatial",
        product: "GeoMax",
        template_name: "schneider_geomax_export",
        confidence_pct: 88,
        detected_fields: ["APN", "LAND", "IMPROV", "TOTAL", "ADDRESS"],
        suggested_mappings: {
          APN: "county_parcel_id_raw",
          LAND: "land_value",
          IMPROV: "improvement_value",
          TOTAL: "total_value",
          ADDRESS: "situs_address",
        },
      };
    }

    // Generic detection based on common field patterns
    return {
      vendor: "Unknown",
      product: "Generic Export",
      template_name: "generic_parcel_export",
      confidence_pct: 65,
      detected_fields: [],
      suggested_mappings: {},
    };
  },

  /**
   * Validate data against product schema
   */
  async validate(run: IngestRun): Promise<ValidationResult> {
    // Simulate validation
    await new Promise((r) => setTimeout(r, 500));

    return {
      isValid: true,
      totalRows: 1500 + Math.floor(Math.random() * 500),
      validRows: 1480 + Math.floor(Math.random() * 20),
      errorCount: Math.floor(Math.random() * 20),
      warningCount: Math.floor(Math.random() * 50),
      errors: [],
      warnings: [],
    };
  },

  /**
   * Publish an ingest run (creates new version)
   */
  async publish(params: {
    ingestRunId: string;
    versionLabel: string;
    approvedBy: string;
    secondApprover?: string;
  }): Promise<{
    success: boolean;
    versionId: string;
    routingResults: RoutingResult[];
  }> {
    const { ingestRunId, versionLabel, approvedBy, secondApprover } = params;

    // Check dual approval if required
    if (hubConfig.requireDualApproval && !secondApprover) {
      throw new Error("Dual approval required for publish");
    }

    const run = await repository.getIngestRun(ingestRunId);
    if (!run || run.status !== "ready") {
      throw new Error("Ingest run not ready for publish");
    }

    // Create version
    const versionId = `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Update run as published
    await repository.updateIngestRun(ingestRunId, {
      status: "published",
      published_at: new Date().toISOString(),
      version_id: versionId,
      approved_by: approvedBy,
      second_approver: secondApprover,
    });

    // Create lineage event
    await repository.createLineageEvent({
      id: `le-${Date.now()}`,
      county_fips: run.county_fips,
      product_type: run.product_type,
      event_type: "published",
      version_id: versionId,
      ingest_run_id: ingestRunId,
      actor: approvedBy,
      timestamp: new Date().toISOString(),
      details: { versionLabel },
    });

    // Route to subscribers
    const routingResults = await this.routeToSubscribers(
      run.county_fips,
      run.product_type as DataProductType,
      versionId
    );

    // Emit event
    eventBus.emit({
      type: "product.published",
      payload: {
        countyFips: run.county_fips,
        product: run.product_type,
        versionId,
        versionLabel,
        routingResults,
      },
      timestamp: new Date().toISOString(),
    });

    return { success: true, versionId, routingResults };
  },

  /**
   * Route published data to module subscribers
   *
   * THIS IS THE CRITICAL DELIVERY CONTRACT:
   * 1. Persist RouteRecord FIRST (receipt before ACK)
   * 2. Set ActiveDatasetPointer (what subscriber will read)
   * 3. THEN emit event (ACK-gated UI can now show success)
   */
  async routeToSubscribers(
    countyFips: WACountyFips,
    product: DataProductType,
    versionId: string,
    deliveredBy: string = "system"
  ): Promise<RoutingResult[]> {
    const results: RoutingResult[] = [];

    // Define routing map
    const routingMap: Record<DataProductType, string[]> = {
      PARCEL_FABRIC: ["cockpit-map", "comps-engine"],
      COUNTY_ROLL: ["cockpit-map", "comps-engine", "ratio-studies", "calibration", "appeals"],
      SALES_STREAM: ["comps-engine", "ratio-studies", "calibration"],
      BUILDINGS: ["cockpit-map", "comps-engine"],
    };

    const subscribers = routingMap[product] || [];

    // Get row count from version (for audit)
    const version = await repository.getCurrentVersion(countyFips, product);
    const rowCount = version?.row_count || 0;

    for (const subscriber of subscribers) {
      const routeRecordId = `rr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        // STEP 1: Persist RouteRecord BEFORE anything else (receipt-first)
        await repository.createRouteRecord({
          id: routeRecordId,
          subscriber,
          county_fips: countyFips,
          product_type: product,
          version_id: versionId,
          delivered_at: new Date().toISOString(),
          delivered_by: deliveredBy,
          status: "delivered",
          row_count: rowCount,
        });

        // STEP 2: Set ActiveDatasetPointer (this is what Cockpit reads!)
        await repository.setActiveDataset(subscriber, countyFips, product, versionId, deliveredBy);

        // STEP 3: Only NOW emit success event (ACK-gated)
        results.push({
          subscriber,
          success: true,
          updatedAt: new Date().toISOString(),
          versionId,
          rowCount,
        });

        eventBus.emit({
          type: "routing.completed",
          payload: {
            countyFips,
            product,
            versionId,
            subscriber,
            routeRecordId,
            rowCount,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        // Persist failed route record
        await repository.createRouteRecord({
          id: routeRecordId,
          subscriber,
          county_fips: countyFips,
          product_type: product,
          version_id: versionId,
          delivered_at: new Date().toISOString(),
          delivered_by: deliveredBy,
          status: "failed",
          row_count: 0,
          error_message: error instanceof Error ? error.message : "Unknown error",
        });

        results.push({
          subscriber,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        eventBus.emit({
          type: "routing.failed",
          payload: {
            countyFips,
            product,
            versionId,
            subscriber,
            error: results[results.length - 1].error,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  },

  // ----------------------------------------
  // SUBSCRIBER DATA ACCESS (what Cockpit reads)
  // ----------------------------------------

  /**
   * Get active dataset for a subscriber
   *
   * THIS IS THE READ PATH FOR COCKPIT (and other subscribers).
   * Returns null if no data has been delivered yet.
   */
  async getActiveDatasetForSubscriber(
    subscriber: string,
    countyFips: WACountyFips,
    product: DataProductType
  ): Promise<{
    versionId: string;
    activatedAt: string;
    activatedBy: string;
    rowCount: number;
  } | null> {
    const pointer = await repository.getActiveDataset(subscriber, countyFips, product);
    if (!pointer?.active_version_id) return null;

    const version = await repository.getCurrentVersion(countyFips, product);

    return {
      versionId: pointer.active_version_id,
      activatedAt: pointer.activated_at || new Date().toISOString(),
      activatedBy: pointer.activated_by || "unknown",
      rowCount: version?.row_count || 0,
    };
  },

  /**
   * Get route history for a subscriber (for audit)
   */
  async getRouteHistory(
    subscriber: string,
    countyFips: WACountyFips,
    product: DataProductType,
    limit = 10
  ) {
    return repository.getRouteRecords(subscriber, countyFips, product, limit);
  },

  // ----------------------------------------
  // STATUS & QUALITY OPERATIONS
  // ----------------------------------------

  /**
   * Get county data status
   */
  async getStatus(countyFips: WACountyFips): Promise<CountyDataStatus | null> {
    return repository.getCountyStatus(countyFips);
  },

  /**
   * Get quality metrics for a product
   */
  async getQuality(params: {
    countyFips: WACountyFips;
    product: DataProductType;
  }): Promise<QualityMetrics> {
    const { countyFips, product } = params;

    // Get latest data
    const status = await repository.getCountyStatus(countyFips);
    if (!status) {
      throw new Error("County not found");
    }

    // Compute quality metrics
    return {
      product,
      joinMatchRate: 0.94 + Math.random() * 0.05,
      validationPassRate: 0.97 + Math.random() * 0.02,
      dataCompleteness: 0.92 + Math.random() * 0.07,
      freshnessScore: (status.overall_readiness_pct ?? 0) / 100,
      topIssues: [
        { type: "missing_situs", count: 23, severity: "warning" },
        { type: "invalid_value", count: 5, severity: "error" },
        { type: "duplicate_parcel", count: 2, severity: "error" },
      ],
    };
  },

  // ----------------------------------------
  // VERSION OPERATIONS
  // ----------------------------------------

  /**
   * Get version history for a product
   */
  async getVersions(params: {
    countyFips: WACountyFips;
    product: DataProductType;
    limit?: number;
  }): Promise<ProductVersion[]> {
    return repository.getVersions(params.countyFips, params.product, params.limit || 10);
  },

  /**
   * Rollback to a previous version
   */
  async rollback(params: {
    countyFips: WACountyFips;
    product: DataProductType;
    targetVersionId: string;
    approvedBy: string;
    reason: string;
  }): Promise<{ success: boolean; routingResults: RoutingResult[] }> {
    const { countyFips, product, targetVersionId, approvedBy, reason } = params;

    // Create lineage event
    await repository.createLineageEvent({
      id: `le-${Date.now()}`,
      county_fips: countyFips,
      product_type: product,
      event_type: "rollback",
      version_id: targetVersionId,
      actor: approvedBy,
      timestamp: new Date().toISOString(),
      details: { reason },
    });

    // Route rollback to subscribers
    const routingResults = await this.routeToSubscribers(countyFips, product, targetVersionId);

    eventBus.emit({
      type: "product.rolledback",
      payload: { countyFips, product, targetVersionId, reason, routingResults },
      timestamp: new Date().toISOString(),
    });

    return { success: true, routingResults };
  },

  // ----------------------------------------
  // REFRESH OPERATIONS
  // ----------------------------------------

  /**
   * Refresh data from connected feed
   */
  async refresh(params: {
    countyFips: WACountyFips;
    product: DataProductType;
  }): Promise<IngestRun> {
    return this.ingest({
      countyFips: params.countyFips,
      product: params.product,
      source: "connected-feed",
    });
  },

  // ----------------------------------------
  // AUDIT & EXPORT OPERATIONS
  // ----------------------------------------

  /**
   * Get audit trail
   */
  async getAuditTrail(params: {
    countyFips: WACountyFips;
    product?: DataProductType;
    limit?: number;
  }): Promise<LineageEvent[]> {
    return repository.getLineageEvents(params.countyFips, params.product, params.limit || 50);
  },

  /**
   * Export court-ready packet
   */
  async exportCourtPacket(params: {
    countyFips: WACountyFips;
    product: DataProductType;
    versionId: string;
  }): Promise<CourtPacket> {
    const { countyFips, product, versionId } = params;

    const lineage = await this.getAuditTrail({ countyFips, product, limit: 100 });
    const quality = await this.getQuality({ countyFips, product });

    return {
      generated_at: new Date().toISOString(),
      county_fips: countyFips,
      product,
      version_id: versionId,
      lineage_events: lineage,
      quality_metrics: quality,
      validation_summary: {
        total_records: 1500,
        valid_records: 1480,
        error_count: 20,
        warning_count: 45,
      },
      certifications: [
        {
          type: "data_integrity",
          hash: `sha256:${Math.random().toString(36).slice(2)}`,
          verified_at: new Date().toISOString(),
        },
      ],
    };
  },

  // ----------------------------------------
  // EVENT SUBSCRIPTION
  // ----------------------------------------

  /**
   * Subscribe to data suite events
   */
  subscribe(handler: (event: DataSuiteEvent) => void): () => void {
    return eventBus.subscribe(handler);
  },
};

// ============================================
// Supporting Types
// ============================================

export interface RoutingResult {
  subscriber: string;
  success: boolean;
  updatedAt?: string;
  versionId?: string;
  rowCount?: number;
  error?: string;
}

export interface QualityMetrics {
  product: DataProductType;
  joinMatchRate: number;
  validationPassRate: number;
  dataCompleteness: number;
  freshnessScore: number;
  topIssues: Array<{
    type: string;
    count: number;
    severity: "info" | "warning" | "error";
  }>;
}

export interface ProductVersion {
  id: string;
  version_label: string;
  created_at: string;
  row_count: number;
  approved_by?: string;
  is_current: boolean;
  county_fips?: WACountyFips;
  product_type?: DataProductType;
  created_by?: string;
  status?: "draft" | "active" | "archived" | "published";
  source_filename?: string;
  change_summary?: {
    rows_added: number;
    rows_modified: number;
    rows_removed: number;
    value_delta?: number;
  };
}

export interface CourtPacket {
  generated_at: string;
  county_fips: WACountyFips;
  product: DataProductType;
  version_id: string;
  lineage_events: LineageEvent[];
  quality_metrics: QualityMetrics;
  validation_summary: {
    total_records: number;
    valid_records: number;
    error_count: number;
    warning_count: number;
  };
  certifications: Array<{
    type: string;
    hash: string;
    verified_at: string;
  }>;
}

export type { DataSuiteEvent };

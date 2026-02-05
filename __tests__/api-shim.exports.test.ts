/**
 * API Shim Exports Contract Test
 * 
 * This test FREEZES the public surface of @/lib/api to prevent export drift.
 * If this test fails, it means exports were removed or renamed - which breaks consumers.
 * 
 * DO NOT remove assertions from this test without verifying all consumers are migrated.
 */

import { describe, it, expect } from "vitest";

// Import from the shim - this is what consumers use
import * as api from "@/lib/api";

// Import from query surface - preferred for reads
import * as query from "@/lib/api/query";

describe("@/lib/api shim exports", () => {
  describe("Type exports (compile-time)", () => {
    it("exports RollYearSnapshot type", () => {
      // Type-only assertion - if this compiles, the type exists
      const _typeCheck: api.RollYearSnapshot | null = null;
      expect(_typeCheck).toBeNull();
    });

    it("exports MapLayer type", () => {
      const _typeCheck: api.MapLayer | null = null;
      expect(_typeCheck).toBeNull();
    });

    it("exports ParcelFilter type", () => {
      const _typeCheck: api.ParcelFilter | null = null;
      expect(_typeCheck).toBeNull();
    });

    it("exports Parcel type", () => {
      const _typeCheck: api.Parcel | null = null;
      expect(_typeCheck).toBeNull();
    });

    it("exports EquityStatus type", () => {
      const _typeCheck: api.EquityStatus | null = null;
      expect(_typeCheck).toBeNull();
    });
  });

  describe("Function exports (runtime)", () => {
    // Authentication
    it("exports login function", () => {
      expect(typeof api.login).toBe("function");
    });

    it("exports logout function", () => {
      expect(typeof api.logout).toBe("function");
    });

    it("exports getCurrentUser function", () => {
      expect(typeof api.getCurrentUser).toBe("function");
    });

    // Parcels & Map
    it("exports getParcels function", () => {
      expect(typeof api.getParcels).toBe("function");
    });

    it("exports getParcelById function", () => {
      expect(typeof api.getParcelById).toBe("function");
    });

    it("exports getMapLayers function", () => {
      expect(typeof api.getMapLayers).toBe("function");
    });

    it("exports getNeighborhoods function", () => {
      expect(typeof api.getNeighborhoods).toBe("function");
    });

    it("exports getPropertyClasses function", () => {
      expect(typeof api.getPropertyClasses).toBe("function");
    });

    it("exports getParcelGeoJson function", () => {
      expect(typeof api.getParcelGeoJson).toBe("function");
    });

    it("exports selectParcelsInPolygon function", () => {
      expect(typeof api.selectParcelsInPolygon).toBe("function");
    });

    it("exports getAggregateStats function", () => {
      expect(typeof api.getAggregateStats).toBe("function");
    });

    // Data ingestion
    it("exports getSourceFields function", () => {
      expect(typeof api.getSourceFields).toBe("function");
    });

    it("exports previewDataset function", () => {
      expect(typeof api.previewDataset).toBe("function");
    });

    it("exports getDatasetErrors function", () => {
      expect(typeof api.getDatasetErrors).toBe("function");
    });

    it("exports downloadErrorCsv function", () => {
      expect(typeof api.downloadErrorCsv).toBe("function");
    });

    it("exports saveFieldMapping function", () => {
      expect(typeof api.saveFieldMapping).toBe("function");
    });

    // Ratio studies
    it("exports getRatioStudies function", () => {
      expect(typeof api.getRatioStudies).toBe("function");
    });

    it("exports runRatioStudy function", () => {
      expect(typeof api.runRatioStudy).toBe("function");
    });

    // Snapshots
    it("exports getRollYearSnapshots function", () => {
      expect(typeof api.getRollYearSnapshots).toBe("function");
    });

    it("exports createRollYearSnapshot function", () => {
      expect(typeof api.createRollYearSnapshot).toBe("function");
    });

    it("exports publishSnapshot function", () => {
      expect(typeof api.publishSnapshot).toBe("function");
    });

    // Aliases for backwards compatibility
    it("exports getSnapshots as alias", () => {
      expect(typeof api.getSnapshots).toBe("function");
    });

    it("exports createSnapshot as alias", () => {
      expect(typeof api.createSnapshot).toBe("function");
    });

    // Audit
    it("exports getAuditLog function", () => {
      expect(typeof api.getAuditLog).toBe("function");
    });

    // Data freshness
    it("exports getDataSources function", () => {
      expect(typeof api.getDataSources).toBe("function");
    });
  });

  describe("Mutator exports (routed through hub)", () => {
    it("exports uploadDataset function", () => {
      expect(typeof api.uploadDataset).toBe("function");
    });

    it("exports validateDataset function", () => {
      expect(typeof api.validateDataset).toBe("function");
    });

    it("exports publishDataset function", () => {
      expect(typeof api.publishDataset).toBe("function");
    });

    it("exports getIngestStatus function", () => {
      expect(typeof api.getIngestStatus).toBe("function");
    });
  });

  describe("Migration observability exports", () => {
    it("exports getMigrationReport function", () => {
      expect(typeof api.getMigrationReport).toBe("function");
    });

    it("exports getDeprecatedCallCounts function", () => {
      expect(typeof api.getDeprecatedCallCounts).toBe("function");
    });

    it("exports resetDeprecatedCallCounts function", () => {
      expect(typeof api.resetDeprecatedCallCounts).toBe("function");
    });

    it("exports assertNoLegacyMutators function", () => {
      expect(typeof api.assertNoLegacyMutators).toBe("function");
    });
  });
});

describe("@/lib/api/query exports", () => {
  it("exports read-only query functions", () => {
    expect(typeof query.getParcels).toBe("function");
    expect(typeof query.getParcelById).toBe("function");
    expect(typeof query.getRatioStudies).toBe("function");
    expect(typeof query.getSnapshots).toBe("function");
    expect(typeof query.getAuditLog).toBe("function");
    expect(typeof query.getCurrentUser).toBe("function");
  });

  it("does NOT export mutator functions", () => {
    // Query surface should not expose mutators
    expect((query as Record<string, unknown>).uploadDataset).toBeUndefined();
    expect((query as Record<string, unknown>).validateDataset).toBeUndefined();
    expect((query as Record<string, unknown>).publishDataset).toBeUndefined();
    expect((query as Record<string, unknown>).createSnapshot).toBeUndefined();
    expect((query as Record<string, unknown>).login).toBeUndefined();
    expect((query as Record<string, unknown>).logout).toBeUndefined();
  });
});

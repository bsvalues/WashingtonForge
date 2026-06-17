/**
 * API Shim Exports Contract Test
 *
 * This test FREEZES the public surface of @/lib/api to prevent export drift.
 * If this test fails, it means exports were removed or renamed - which breaks consumers.
 *
 * DO NOT remove assertions from this test without verifying all consumers are migrated.
 *
 * ENFORCEMENT ARCHITECTURE:
 * ========================
 * 1. ESLint Rule (lib/api/** → barrel-only imports)
 *    - Blocks all deep imports: @/lib/api-internal/*
 *    - Forces all imports through @/lib/api-internal barrel
 *
 * 2. Query Surface Allowlist (this file)
 *    - ALLOWED_QUERY_EXPORTS = single source of truth
 *    - Exact set equality: catches leakage (unexpected) AND breakage (missing)
 *    - Three-layer protection: allowlist → blacklist → regex backstop
 *
 * 3. API Shim Surface (this file)
 *    - Individual assertions for all required exports
 *    - Type exports verified at compile-time
 *
 * These tripwires make it impossible to accidentally:
 * - Add mutators to the query surface
 * - Remove required exports
 * - Bypass the barrel with deep imports
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

    it("exports ComplianceResult type", () => {
      const _typeCheck: api.ComplianceResult | null = null;
      expect(_typeCheck).toBeNull();
    });

    it("exports AuditLogEntry type", () => {
      const _typeCheck: api.AuditLogEntry | null = null;
      expect(_typeCheck).toBeNull();
    });
  });

  describe("Constant exports (runtime)", () => {
    it("exports IAAO_RESIDENTIAL_THRESHOLDS constant", () => {
      expect(api.IAAO_RESIDENTIAL_THRESHOLDS).toBeDefined();
      expect(typeof api.IAAO_RESIDENTIAL_THRESHOLDS).toBe("object");
      expect(api.IAAO_RESIDENTIAL_THRESHOLDS.ratioMin).toBe(0.9);
      expect(api.IAAO_RESIDENTIAL_THRESHOLDS.ratioMax).toBe(1.1);
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
  // ============================================
  // ALLOWLIST-FIRST GUARD (PRIMARY)
  // ============================================
  // This is the strongest protection: query surface can ONLY export
  // symbols on this explicit allowlist. New additions require test update.
  const ALLOWED_QUERY_EXPORTS = [
    // Dataset queries
    "getParcels",
    "getParcelById",
    "getSourceFields",
    "previewDataset",
    "getDatasetErrors",
    // Ratio studies
    "getRatioStudies",
    "runRatioStudy",
    // Snapshots (read-only)
    "getSnapshots",
    // Audit
    "getAuditLog",
    // Data sources
    "getDataSources",
    // Auth (read-only)
    "getCurrentUser",
  ];

  it("exports EXACTLY the allowed functions (strict set equality)", () => {
    const queryExports = Object.keys(query).filter(
      (k) => typeof (query as Record<string, unknown>)[k] === "function"
    );

    // Check for unexpected exports (leakage)
    const unexpectedExports = queryExports.filter((name) => !ALLOWED_QUERY_EXPORTS.includes(name));

    // Check for missing exports (breakage)
    const missingExports = ALLOWED_QUERY_EXPORTS.filter((name) => !queryExports.includes(name));

    const errors: string[] = [];

    if (unexpectedExports.length > 0) {
      errors.push(
        `LEAKAGE: Query surface has unexpected exports: ${unexpectedExports.join(", ")}.\n` +
          `  → If legitimate read-only, add to ALLOWED_QUERY_EXPORTS.\n` +
          `  → If mutators, route through dataSuiteHub instead.`
      );
    }

    if (missingExports.length > 0) {
      errors.push(
        `BREAKAGE: Query surface is missing expected exports: ${missingExports.join(", ")}.\n` +
          `  → Restore these exports or update ALLOWED_QUERY_EXPORTS.`
      );
    }

    if (errors.length > 0) {
      throw new Error(`Query surface integrity check failed:\n\n${errors.join("\n\n")}`);
    }

    // Exact equality assertion (sorted for deterministic output)
    expect([...queryExports].sort()).toEqual([...ALLOWED_QUERY_EXPORTS].sort());
  });

  // ============================================
  // EXPLICIT BLACKLIST GUARD (SECONDARY)
  // ============================================
  it("does NOT export known mutator functions", () => {
    const knownMutators = [
      "uploadDataset",
      "validateDataset",
      "publishDataset",
      "createSnapshot",
      "createRollYearSnapshot",
      "saveFieldMapping",
      "login",
      "logout",
      "routeToSubscribers",
      "setActiveDataset",
    ];

    for (const name of knownMutators) {
      expect((query as Record<string, unknown>)[name]).toBeUndefined();
    }
  });

  // ============================================
  // REGEX BACKSTOP (TERTIARY)
  // ============================================
  // Catches new mutators that might slip through naming conventions.
  // Tuned to avoid false positives (removed "export" which is ambiguous).
  it("does NOT export any function matching mutator verb patterns", () => {
    const mutatorPatterns = [
      /^upload/i,
      /^create/i,
      /^save/i,
      /^delete/i,
      /^remove/i,
      /^update/i,
      /^publish/i,
      /^route/i,
      /^setActive/i,
      /^import(?!.*from)/i, // "import" but not "importFrom" style naming
      /^write/i,
      /^insert/i,
      /^login$/i,
      /^logout$/i,
      /^reset(?!Deprecated)/i, // "reset" but not "resetDeprecated" (observability)
    ];

    const queryExports = Object.keys(query);
    const violators = queryExports.filter((name) =>
      mutatorPatterns.some((pattern) => pattern.test(name))
    );

    if (violators.length > 0) {
      throw new Error(
        `Query surface contains mutator-like exports: ${violators.join(", ")}.\n` +
          `Mutators must go through dataSuiteHub, not lib/api/query.`
      );
    }
  });
});

// ============================================
// SURFACE INTEGRITY
// ============================================

describe("API surface integrity", () => {
  it("api/query exports are read-only subset (no hub, no deprecated tracking)", () => {
    // These symbols should NEVER appear on the query surface
    const forbiddenOnQuery = [
      "dataSuiteHub",
      "getDeprecatedCallCounts",
      "getMigrationReport",
      "assertNoLegacyMutators",
      "resetDeprecatedCallCounts",
    ];

    const queryExports = Object.keys(query);
    const violations = forbiddenOnQuery.filter((name) => queryExports.includes(name));

    expect(violations).toEqual([]);
  });
});

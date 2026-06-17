/**
 * Data Plane Contract Tests
 *
 * These tests prove the data delivery contract is real:
 * 1. Routing persists a RouteRecord BEFORE emitting events
 * 2. Routing sets an ActiveDatasetPointer
 * 3. getActiveDataset returns null when missing
 *
 * Run: pnpm test __tests__/data-plane.contract.test.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { dataSuiteHub, repository, eventBus } from "@/lib/data-suite";
import type { WACountyFips, DataProductType } from "@/lib/data-suite";

const TEST_COUNTY: WACountyFips = "53005"; // Benton County
const TEST_PRODUCT: DataProductType = "COUNTY_ROLL";
const TEST_VERSION = "v-test-12345";

describe("Data Plane Contract", () => {
  beforeEach(() => {
    // Clear all state before each test
    repository.clear();
    eventBus.clear();
  });

  describe("route_persists_record_before_events", () => {
    it("should persist RouteRecord before emitting routing.completed event", async () => {
      // Track event timing
      let routeRecordExistedWhenEventEmitted = false;

      // Subscribe to events and check if route record exists
      const unsubscribe = eventBus.subscribe(async (event) => {
        if (event.type === "routing.completed") {
          const records = await repository.getRouteRecords(
            event.payload.subscriber as string,
            event.payload.countyFips as WACountyFips,
            event.payload.product as DataProductType,
            1
          );
          routeRecordExistedWhenEventEmitted = records.length > 0;
        }
      });

      // Set up initial county status (required for routing)
      await repository.updateCountyStatus(TEST_COUNTY, {
        county_name: "Test County",
        overall_readiness_pct: 100,
      });

      // Create a version to route
      await repository.createVersion(TEST_COUNTY, TEST_PRODUCT, {
        id: TEST_VERSION,
        county_fips: TEST_COUNTY,
        product_type: TEST_PRODUCT,
        created_at: new Date().toISOString(),
        created_by: "test@test.com",
        row_count: 100,
        status: "published",
        is_current: true,
        version_label: "Test v1",
        source_filename: "test.csv",
      });

      // Execute routing
      await dataSuiteHub.routeToSubscribers(
        TEST_COUNTY,
        TEST_PRODUCT,
        TEST_VERSION,
        "test@test.com"
      );

      unsubscribe();

      // ASSERTION: RouteRecord existed BEFORE event was emitted
      expect(routeRecordExistedWhenEventEmitted).toBe(true);
    });

    it("should create RouteRecord with correct status", async () => {
      await repository.updateCountyStatus(TEST_COUNTY, {
        county_name: "Test County",
        overall_readiness_pct: 100,
      });

      await repository.createVersion(TEST_COUNTY, TEST_PRODUCT, {
        id: TEST_VERSION,
        county_fips: TEST_COUNTY,
        product_type: TEST_PRODUCT,
        created_at: new Date().toISOString(),
        created_by: "test@test.com",
        row_count: 100,
        status: "published",
        is_current: true,
        version_label: "Test v1",
        source_filename: "test.csv",
      });

      await dataSuiteHub.routeToSubscribers(
        TEST_COUNTY,
        TEST_PRODUCT,
        TEST_VERSION,
        "test@test.com"
      );

      const records = await repository.getRouteRecords("cockpit-map", TEST_COUNTY, TEST_PRODUCT, 1);

      expect(records.length).toBe(1);
      expect(records[0].status).toBe("delivered");
      expect(records[0].version_id).toBe(TEST_VERSION);
      expect(records[0].subscriber).toBe("cockpit-map");
    });
  });

  describe("route_sets_active_pointer", () => {
    it("should set ActiveDatasetPointer when routing succeeds", async () => {
      await repository.updateCountyStatus(TEST_COUNTY, {
        county_name: "Test County",
        overall_readiness_pct: 100,
      });

      await repository.createVersion(TEST_COUNTY, TEST_PRODUCT, {
        id: TEST_VERSION,
        county_fips: TEST_COUNTY,
        product_type: TEST_PRODUCT,
        created_at: new Date().toISOString(),
        created_by: "test@test.com",
        row_count: 100,
        status: "published",
        is_current: true,
        version_label: "Test v1",
        source_filename: "test.csv",
      });

      await dataSuiteHub.routeToSubscribers(
        TEST_COUNTY,
        TEST_PRODUCT,
        TEST_VERSION,
        "test@test.com"
      );

      const pointer = await repository.getActiveDataset("cockpit-map", TEST_COUNTY, TEST_PRODUCT);

      expect(pointer).not.toBeNull();
      expect(pointer?.active_version_id).toBe(TEST_VERSION);
      expect(pointer?.activated_by).toBe("test@test.com");
    });

    it("should set pointer BEFORE emitting event", async () => {
      let pointerExistedWhenEventEmitted = false;

      const unsubscribe = eventBus.subscribe(async (event) => {
        if (event.type === "routing.completed") {
          const pointer = await repository.getActiveDataset(
            event.payload.subscriber as string,
            event.payload.countyFips as WACountyFips,
            event.payload.product as DataProductType
          );
          pointerExistedWhenEventEmitted = pointer?.active_version_id !== null;
        }
      });

      await repository.updateCountyStatus(TEST_COUNTY, {
        county_name: "Test County",
        overall_readiness_pct: 100,
      });

      await repository.createVersion(TEST_COUNTY, TEST_PRODUCT, {
        id: TEST_VERSION,
        county_fips: TEST_COUNTY,
        product_type: TEST_PRODUCT,
        created_at: new Date().toISOString(),
        created_by: "test@test.com",
        row_count: 100,
        status: "published",
        is_current: true,
        version_label: "Test v1",
        source_filename: "test.csv",
      });

      await dataSuiteHub.routeToSubscribers(
        TEST_COUNTY,
        TEST_PRODUCT,
        TEST_VERSION,
        "test@test.com"
      );

      unsubscribe();

      expect(pointerExistedWhenEventEmitted).toBe(true);
    });
  });

  describe("get_active_dataset_returns_null_when_missing", () => {
    it("should return null when no data has been delivered", async () => {
      const pointer = await repository.getActiveDataset("cockpit-map", TEST_COUNTY, TEST_PRODUCT);
      expect(pointer).toBeNull();
    });

    it("should return null for undelivered subscriber", async () => {
      // Deliver to cockpit-map only
      await repository.setActiveDataset(
        "cockpit-map",
        TEST_COUNTY,
        TEST_PRODUCT,
        TEST_VERSION,
        "test@test.com"
      );

      // Check a different subscriber that wasn't delivered to
      const pointer = await repository.getActiveDataset(
        "non-existent-subscriber",
        TEST_COUNTY,
        TEST_PRODUCT
      );
      expect(pointer).toBeNull();
    });

    it("hub.getActiveDatasetForSubscriber should return null when missing", async () => {
      const result = await dataSuiteHub.getActiveDatasetForSubscriber(
        "cockpit-map",
        TEST_COUNTY,
        TEST_PRODUCT
      );
      expect(result).toBeNull();
    });
  });

  describe("end-to-end delivery chain", () => {
    it("should complete full delivery: ingest -> publish -> route -> readable", async () => {
      // 1. Set up county
      await repository.updateCountyStatus(TEST_COUNTY, {
        county_name: "Benton County",
        overall_readiness_pct: 100,
      });

      // 2. Create and publish version
      const version = await repository.createVersion(TEST_COUNTY, TEST_PRODUCT, {
        id: TEST_VERSION,
        county_fips: TEST_COUNTY,
        product_type: TEST_PRODUCT,
        created_at: new Date().toISOString(),
        created_by: "jane.assessor@county.gov",
        row_count: 42800,
        status: "published",
        is_current: true,
        version_label: "2026 Certified",
        source_filename: "roll_2026.csv",
      });

      // 3. Route to subscribers
      const routingResults = await dataSuiteHub.routeToSubscribers(
        TEST_COUNTY,
        TEST_PRODUCT,
        TEST_VERSION,
        "jane.assessor@county.gov"
      );

      // Verify routing succeeded
      expect(routingResults.length).toBeGreaterThan(0);
      expect(routingResults.every((r) => r.success)).toBe(true);

      // 4. Verify cockpit can read the delivered data
      const activeDataset = await dataSuiteHub.getActiveDatasetForSubscriber(
        "cockpit-map",
        TEST_COUNTY,
        TEST_PRODUCT
      );

      expect(activeDataset).not.toBeNull();
      expect(activeDataset?.versionId).toBe(TEST_VERSION);
      expect(activeDataset?.rowCount).toBe(42800);
      expect(activeDataset?.activatedBy).toBe("jane.assessor@county.gov");
    });
  });
});

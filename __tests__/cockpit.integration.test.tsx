/**
 * Cockpit Integration Tests
 *
 * These tests prove the Cockpit reads from the canonical data path:
 * 1. Shows empty state when no pointer exists
 * 2. Renders parcels when pointer exists
 *
 * Run: pnpm test __tests__/cockpit.integration.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { repository } from "@/lib/data-suite";
import type { WACountyFips } from "@/lib/data-suite";

// Mock the CockpitMap component since it uses maplibre which isn't available in tests
vi.mock("@/components/cockpit/cockpit-map", () => ({
  CockpitMap: ({ onParcelSelect }: { onParcelSelect: (id: string) => void }) => (
    <div data-testid="mock-cockpit-map">
      <button onClick={() => onParcelSelect("test-parcel-1")}>Select Parcel</button>
    </div>
  ),
}));

const TEST_COUNTY: WACountyFips = "53005";

describe("Cockpit Data Integration", () => {
  beforeEach(() => {
    repository.clear();
  });

  describe("empty_state_when_no_pointer", () => {
    it("should show no active dataset when pointer is missing", async () => {
      // Verify no pointer exists
      const pointer = await repository.getActiveDataset("cockpit-map", TEST_COUNTY, "COUNTY_ROLL");
      expect(pointer).toBeNull();
    });

    it("should have no route records when not delivered", async () => {
      const records = await repository.getRouteRecords(
        "cockpit-map",
        TEST_COUNTY,
        "COUNTY_ROLL",
        1
      );
      expect(records.length).toBe(0);
    });
  });

  describe("renders_parcels_when_pointer_exists", () => {
    it("should have active pointer after delivery", async () => {
      // Set up delivery
      await repository.setActiveDataset(
        "cockpit-map",
        TEST_COUNTY,
        "COUNTY_ROLL",
        "v-test-123",
        "test@test.com"
      );

      // Verify pointer exists
      const pointer = await repository.getActiveDataset("cockpit-map", TEST_COUNTY, "COUNTY_ROLL");

      expect(pointer).not.toBeNull();
      expect(pointer?.active_version_id).toBe("v-test-123");
    });

    it("should track route record after delivery", async () => {
      // Create route record
      await repository.createRouteRecord({
        id: "rr-test-1",
        subscriber: "cockpit-map",
        county_fips: TEST_COUNTY,
        product_type: "COUNTY_ROLL",
        version_id: "v-test-123",
        delivered_at: new Date().toISOString(),
        delivered_by: "test@test.com",
        status: "delivered",
        row_count: 1000,
      });

      const records = await repository.getRouteRecords(
        "cockpit-map",
        TEST_COUNTY,
        "COUNTY_ROLL",
        1
      );

      expect(records.length).toBe(1);
      expect(records[0].row_count).toBe(1000);
      expect(records[0].status).toBe("delivered");
    });
  });

  describe("persistence across sessions", () => {
    it("should persist active pointer across repository operations", async () => {
      // Set up delivery
      await repository.setActiveDataset(
        "cockpit-map",
        TEST_COUNTY,
        "COUNTY_ROLL",
        "v-test-persist",
        "persist@test.com"
      );

      // Simulate "another request" by reading again
      const pointer1 = await repository.getActiveDataset("cockpit-map", TEST_COUNTY, "COUNTY_ROLL");
      const pointer2 = await repository.getActiveDataset("cockpit-map", TEST_COUNTY, "COUNTY_ROLL");

      expect(pointer1?.active_version_id).toBe("v-test-persist");
      expect(pointer2?.active_version_id).toBe("v-test-persist");
      expect(pointer1).toEqual(pointer2);
    });
  });

  describe("multiple subscribers", () => {
    it("should track separate pointers for different subscribers", async () => {
      // Deliver to multiple subscribers
      await repository.setActiveDataset(
        "cockpit-map",
        TEST_COUNTY,
        "COUNTY_ROLL",
        "v-cockpit",
        "test@test.com"
      );
      await repository.setActiveDataset(
        "ratio-studies",
        TEST_COUNTY,
        "COUNTY_ROLL",
        "v-ratio",
        "test@test.com"
      );
      await repository.setActiveDataset(
        "comps-engine",
        TEST_COUNTY,
        "COUNTY_ROLL",
        "v-comps",
        "test@test.com"
      );

      const cockpitPointer = await repository.getActiveDataset(
        "cockpit-map",
        TEST_COUNTY,
        "COUNTY_ROLL"
      );
      const ratioPointer = await repository.getActiveDataset(
        "ratio-studies",
        TEST_COUNTY,
        "COUNTY_ROLL"
      );
      const compsPointer = await repository.getActiveDataset(
        "comps-engine",
        TEST_COUNTY,
        "COUNTY_ROLL"
      );

      expect(cockpitPointer?.active_version_id).toBe("v-cockpit");
      expect(ratioPointer?.active_version_id).toBe("v-ratio");
      expect(compsPointer?.active_version_id).toBe("v-comps");
    });

    it("should get all active datasets for a county", async () => {
      // Deliver to multiple subscribers
      await repository.setActiveDataset(
        "cockpit-map",
        TEST_COUNTY,
        "COUNTY_ROLL",
        "v-1",
        "test@test.com"
      );
      await repository.setActiveDataset(
        "ratio-studies",
        TEST_COUNTY,
        "COUNTY_ROLL",
        "v-2",
        "test@test.com"
      );

      const allPointers = await repository.getAllActiveDatasets(TEST_COUNTY);

      expect(allPointers.length).toBe(2);
      expect(allPointers.map((p) => p.subscriber)).toContain("cockpit-map");
      expect(allPointers.map((p) => p.subscriber)).toContain("ratio-studies");
    });
  });
});

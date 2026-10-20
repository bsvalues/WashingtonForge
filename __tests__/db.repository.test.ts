/**
 * Data Layer (lib/db) Tests
 *
 * Proves the repository maps real Postgres rows into the app's Parcel shape
 * and that the provenance logic correctly reports live vs simulated.
 *
 * The pg pool and redis cache are mocked so no real database is needed.
 *
 * Run: pnpm test __tests__/db.repository.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the pool + cache modules so no real DB/Redis is touched.
vi.mock("@/lib/db/pool", () => ({
  getGeoPool: vi.fn(),
  getAppPool: vi.fn(),
  isGeoConfigured: vi.fn(),
  isAppConfigured: vi.fn(),
  pingPool: vi.fn(),
  closePools: vi.fn(),
}));
vi.mock("@/lib/db/cache", () => ({
  getRedis: vi.fn(),
  isRedisConfigured: vi.fn(),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDel: vi.fn(),
  closeRedis: vi.fn(),
}));

import { getGeoPool, getAppPool, pingPool } from "@/lib/db/pool";
import { cacheGet, cacheSet, isRedisConfigured } from "@/lib/db/cache";
import { getParcelsGeoJSON, getParcelStats, getParcelCount } from "@/lib/db/repository";
import { getProvenance } from "@/lib/db/provenance";

const mockGeoPool = { query: vi.fn() } as any;
const mockAppPool = { query: vi.fn() } as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getParcelsGeoJSON", () => {
  it("returns an empty FeatureCollection when no geo pool is configured", async () => {
    (getGeoPool as any).mockReturnValue(null);
    const fc = await getParcelsGeoJSON({ limit: 10 });
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toEqual([]);
  });

  it("maps raw parcel_current rows into GeoJSON features with real geometry", async () => {
    (getGeoPool as any).mockReturnValue(mockGeoPool);
    mockGeoPool.query.mockResolvedValue({
      rows: [
        {
          prop_id: 101,
          parcel_id: "12-34-567-001",
          situs: "100 Main St, Richland",
          owner_name: "Jane Doe",
          gis_acres: "2.5",
          prop_type_cd: "R1",
          prop_type_desc: "Single Family",
          zoning: "R-1",
          hood_cd: "Downtown",
          appraised_val: "500000",
          assessed_val: "480000",
          market: "500000",
          land_val: "150000",
          imprv_val: "330000",
          last_appraisal_dt: "2025-01-15",
          geom_geojson: JSON.stringify({
            type: "MultiPolygon",
            coordinates: [
              [
                [
                  [-119.3, 46.3],
                  [-119.3, 46.31],
                  [-119.29, 46.31],
                  [-119.3, 46.3],
                ],
              ],
            ],
          }),
        },
      ],
    });

    const fc = await getParcelsGeoJSON({ limit: 10 });
    expect(fc.features).toHaveLength(1);
    const f = fc.features[0];
    expect(f.id).toBe("101");
    expect(f.geometry.type).toBe("MultiPolygon");
    expect(f.properties.parcelId).toBe("12-34-567-001");
    expect(f.properties.ownerName).toBe("Jane Doe");
    expect(f.properties.assessedValue).toBe(480000);
    expect(f.properties.marketValue).toBe(500000);
    // 480000 / 500000 = 0.96 → within 0.95–1.05 → fair
    expect(f.properties.equityStatus).toBe("fair");
    expect(f.properties.ratio).toBe(0.96);
  });

  it("derives progressive/regressive equity status from assessed vs market", async () => {
    (getGeoPool as any).mockReturnValue(mockGeoPool);
    const geo = JSON.stringify({
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    });
    mockGeoPool.query.mockResolvedValue({
      rows: [
        {
          prop_id: 1,
          parcel_id: "a",
          situs: "",
          owner_name: "",
          gis_acres: "1",
          prop_type_cd: "R1",
          prop_type_desc: "Single Family",
          zoning: "",
          hood_cd: "",
          appraised_val: "0",
          assessed_val: "550000",
          market: "500000", // ratio 1.10 → progressive
          land_val: "0",
          imprv_val: "0",
          last_appraisal_dt: null,
          geom_geojson: geo,
        },
        {
          prop_id: 2,
          parcel_id: "b",
          situs: "",
          owner_name: "",
          gis_acres: "1",
          prop_type_cd: "R1",
          prop_type_desc: "Single Family",
          zoning: "",
          hood_cd: "",
          appraised_val: "0",
          assessed_val: "400000",
          market: "500000", // ratio 0.80 → regressive
          land_val: "0",
          imprv_val: "0",
          last_appraisal_dt: null,
          geom_geojson: geo,
        },
      ],
    });

    const fc = await getParcelsGeoJSON({ limit: 10 });
    expect(fc.features[0].properties.equityStatus).toBe("progressive");
    expect(fc.features[1].properties.equityStatus).toBe("regressive");
  });

  it("builds a spatial bbox filter when a bbox is provided", async () => {
    (getGeoPool as any).mockReturnValue(mockGeoPool);
    mockGeoPool.query.mockResolvedValue({ rows: [] });

    await getParcelsGeoJSON({
      bbox: { minLng: -119.5, minLat: 46.1, maxLng: -119.2, maxLat: 46.4 },
      limit: 100,
    });

    expect(mockGeoPool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mockGeoPool.query.mock.calls[0];
    expect(sql).toContain("ST_Transform(ST_MakeEnvelope");
    expect(params).toEqual([-119.5, 46.1, -119.2, 46.4, 100, 0]);
  });

  it("applies sampleEvery as a prop_id modulo filter", async () => {
    (getGeoPool as any).mockReturnValue(mockGeoPool);
    mockGeoPool.query.mockResolvedValue({ rows: [] });

    await getParcelsGeoJSON({ limit: 100, sampleEvery: 50 });

    const [sql, params] = mockGeoPool.query.mock.calls[0];
    expect(sql).toContain("prop_id % $1 = 0");
    expect(params).toEqual([50, 100, 0]);
  });
});

describe("getParcelStats / getParcelCount", () => {
  it("returns null stats when no pool is configured", async () => {
    (getGeoPool as any).mockReturnValue(null);
    expect(await getParcelStats()).toBeNull();
    expect(await getParcelCount()).toBe(0);
  });

  it("returns aggregated stats from the pool", async () => {
    (getGeoPool as any).mockReturnValue(mockGeoPool);
    (cacheGet as any).mockResolvedValue(null);
    mockGeoPool.query.mockResolvedValue({
      rows: [
        {
          count: 74058,
          total_assessed: 12345678901.5,
          total_market: 13000000000,
          median_assessed: 450000,
          with_geometry: 74058,
        },
      ],
    });

    const stats = await getParcelStats();
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(74058);
    expect(stats!.withGeometry).toBe(74058);
    expect(stats!.medianAssessed).toBe(450000);
    // stats should be cached for 5 minutes
    expect(cacheSet).toHaveBeenCalledWith("wf:parcel:stats:v1", stats, 300);
  });
});

describe("getProvenance", () => {
  it("reports simulated when no pools are configured", async () => {
    (getGeoPool as any).mockReturnValue(null);
    (getAppPool as any).mockReturnValue(null);
    (isRedisConfigured as any).mockReturnValue(false);
    // Mirror real pingPool: null pool → false
    (pingPool as any).mockImplementation(async (pool: any) => (pool ? true : false));

    const p = await getProvenance();
    expect(p.mode).toBe("simulated");
    expect(p.geo).toBe(false);
    expect(p.app).toBe(false);
    expect(p.parcelCount).toBe(0);
  });

  it("reports live when the geo pool round-trips", async () => {
    (getGeoPool as any).mockReturnValue(mockGeoPool);
    (getAppPool as any).mockReturnValue(mockAppPool);
    (isRedisConfigured as any).mockReturnValue(true);
    (pingPool as any).mockImplementation(async (pool: any) => (pool ? true : false));
    mockGeoPool.query.mockResolvedValue({ rows: [{ n: 74058 }] });

    const p = await getProvenance();
    expect(p.mode).toBe("live");
    expect(p.geo).toBe(true);
    expect(p.app).toBe(true);
    expect(p.redis).toBe(true);
    expect(p.parcelCount).toBe(74058);
  });
});

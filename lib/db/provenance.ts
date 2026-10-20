/**
 * WashingtonForge — data provenance (server-only).
 *
 * Answers the F2/F4 question: "is the data I'm looking at REAL or SIMULATED?"
 *
 * Provenance is computed from actual connectivity, not a flag:
 *  - geo  = the parcel-fabric pool is configured AND a SELECT 1 round-trips
 *  - app  = the app-state pool is configured AND a SELECT 1 round-trips
 *  - redis= the cache client is configured
 *
 * `mode` is "live" only when the parcel fabric is reachable; otherwise
 * "simulated". This is what the UI badge and /api/health report.
 */
import { getGeoPool, getAppPool, pingPool } from "./pool";
import { isRedisConfigured as redisConfigured } from "./cache";

export interface Provenance {
  mode: "live" | "simulated";
  geo: boolean;
  app: boolean;
  redis: boolean;
  parcelCount: number;
  checkedAt: string;
}

export async function getProvenance(): Promise<Provenance> {
  const [geo, app] = await Promise.all([
    Boolean(await pingPool(getGeoPool())),
    Boolean(await pingPool(getAppPool())),
  ]);
  const redis = redisConfigured();

  let parcelCount = 0;
  if (geo) {
    try {
      const pool = getGeoPool();
      const res = await pool!.query("SELECT count(*)::int AS n FROM parcel_current WHERE geom IS NOT NULL");
      parcelCount = res.rows[0]?.n ?? 0;
    } catch {
      parcelCount = 0;
    }
  }

  return {
    mode: geo ? "live" : "simulated",
    geo,
    app,
    redis,
    parcelCount,
    checkedAt: new Date().toISOString(),
  };
}

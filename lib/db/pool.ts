/**
 * WashingtonForge — Postgres connection pools (server-only).
 *
 * Two pools:
 *  - geo pool  → `benton_geo`   (read-only parcel fabric: parcel_current, plat, ...)
 *  - app pool  → `washingtonforge` (writable app state: notes, review_status, ...)
 *
 * Both are LAZY and OPTIONAL. If the env vars are not set (e.g. a pure demo
 * deployment with no database), the getters return `null` and callers fall
 * back to demo/simulated data. This keeps the app runnable with zero infra.
 *
 * IMPORTANT: This module imports `pg` (a Node-only dependency). It must only
 * be imported from server-side code (API routes, server components). Never
 * import it from a "use client" component.
 */
import { Pool, type PoolConfig } from "pg";

const MAX = Number(process.env.WF_PG_POOL_MAX ?? 10);

function buildPool(url: string | undefined): Pool | null {
  if (!url) return null;
  const config: PoolConfig = {
    connectionString: url,
    max: MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Fail fast so we can fall back to demo mode instead of hanging.
    statement_timeout: 15_000,
  };
  return new Pool(config);
}

let geoPool: Pool | null | undefined;
let appPool: Pool | null | undefined;

/** Read-only pool for the parcel fabric (benton_geo). Null if not configured. */
export function getGeoPool(): Pool | null {
  if (geoPool === undefined) {
    geoPool = buildPool(process.env.WF_GEO_DATABASE_URL);
  }
  return geoPool;
}

/** Writable pool for app state (washingtonforge). Null if not configured. */
export function getAppPool(): Pool | null {
  if (appPool === undefined) {
    appPool = buildPool(process.env.WF_APP_DATABASE_URL);
  }
  return appPool;
}

/** True when a parcel-fabric pool is configured (real data available). */
export function isGeoConfigured(): boolean {
  return getGeoPool() !== null;
}

/** True when an app-state pool is configured. */
export function isAppConfigured(): boolean {
  return getAppPool() !== null;
}

/**
 * Run a quick connectivity probe against a pool. Returns true only if a real
 * `SELECT 1` round-trips. Used by /api/health for provenance.
 */
export async function pingPool(pool: Pool | null): Promise<boolean> {
  if (!pool) return false;
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      return true;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}

/** Close both pools (used by tests / graceful shutdown). */
export async function closePools(): Promise<void> {
  if (geoPool) await geoPool.end().catch(() => {});
  if (appPool) await appPool.end().catch(() => {});
  geoPool = undefined;
  appPool = undefined;
}

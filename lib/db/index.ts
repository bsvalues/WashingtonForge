/**
 * WashingtonForge — data layer barrel (server-only).
 *
 * Re-exports the pool, cache, and repository. Import from "@/lib/db" in
 * server-side code (API routes, server components). Never from "use client".
 */
export {
  getGeoPool,
  getAppPool,
  isGeoConfigured,
  isAppConfigured,
  pingPool,
  closePools,
} from "./pool";
export { getRedis, isRedisConfigured, cacheGet, cacheSet, cacheDel, closeRedis } from "./cache";
export * from "./repository";

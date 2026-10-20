/**
 * WashingtonForge — Redis cache layer (server-only).
 *
 * A thin JSON get/set wrapper over ioredis with a TTL. If Redis is not
 * configured or is unreachable, every call degrades gracefully to a cache
 * miss (no throw), so the data layer keeps working against Postgres alone.
 *
 * IMPORTANT: imports `ioredis` (Node-only). Server-side only.
 */
import Redis from "ioredis";

let client: Redis | null | undefined;

/**
 * Lazily create the Redis client. Returns null when WF_REDIS_URL is not set.
 * `lazyConnect` + `maxRetriesPerRequest: 1` keep a dead Redis from stalling
 * requests — we just get a fast miss.
 */
export function getRedis(): Redis | null {
  if (client === undefined) {
    const url = process.env.WF_REDIS_URL;
    if (!url) {
      client = null;
      return null;
    }
    client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      commandTimeout: 1_500,
    });
    // Swallow connection errors — a cache miss is acceptable, a crash is not.
    client.on("error", () => {
      /* ignore: treated as a cache miss */
    });
  }
  return client;
}

/** True when a Redis client is configured. */
export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}

/**
 * Read a JSON value from the cache. Returns null on miss or any error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Write a JSON value to the cache with a TTL (seconds). No-op on error.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore: cache write failure is non-fatal */
  }
}

/** Delete a cache key. No-op on error. */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* ignore */
  }
}

/** Close the Redis client (tests / shutdown). */
export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => {});
    client = undefined;
  }
}

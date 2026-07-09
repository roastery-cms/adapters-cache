import type { RedisClient } from "bun";

/**
 * Static type of the cache instance decorated by the `cache` plugin
 * (`@roastery-adapters/cache/plugins`).
 *
 * Modeled as Bun's native `RedisClient` intersected with an optional
 * `flushall`, since the two providers behind the plugin expose different
 * shapes at runtime:
 * - `CACHE_PROVIDER: "REDIS"` → a real `RedisClient`, which has no `flushall`
 *   (only `send`).
 * - `CACHE_PROVIDER: "MEMORY"` → an `ioredis-mock` instance, which does
 *   implement `flushall(): Promise<"OK">`.
 *
 * `flushall` is optional — not required — precisely because the `RedisClient`
 * branch genuinely lacks it; callers should guard with `cache.flushall?.()`.
 */
export type BaristaCacheInstance = RedisClient & {
	flushall?: () => Promise<"OK">;
};

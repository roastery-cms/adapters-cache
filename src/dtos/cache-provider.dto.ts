import { t } from "@roastery/terroir";

/**
 * Schema for the supported cache backends.
 *
 * @remarks
 * `"REDIS"` selects a real Redis connection (Bun's native `RedisClient`);
 * `"MEMORY"` selects an in-memory mock (`ioredis-mock`), also used as the
 * fallback whenever `REDIS_URL` is missing. See the `cache` factory
 * (`@roastery-adapters/cache`) for how this drives the actual instance
 * construction.
 */
export const CacheProviderDTO = t.Union([
	t.Literal("REDIS"),
	t.Literal("MEMORY"),
]);

/**
 * Static type inferred from {@link CacheProviderDTO}: `"REDIS" | "MEMORY"`.
 */
export type CacheProviderDTO = t.Static<typeof CacheProviderDTO>;

/**
 * `@roastery-adapters/cache` — Redis and in-memory cache adapter for the
 * Roastery CMS ecosystem.
 *
 * The package centres on the {@link cache} factory, which decorates a
 * `@roastery/barista` application with a `cache` instance backed by either a
 * real Redis connection (Bun's native `RedisClient`) or an in-memory mock
 * (`ioredis-mock`), depending on the provided configuration. The companion
 * `SafeCache` decorator (in `@roastery-adapters/cache/decorators`) wraps
 * repository methods with structured error handling for Redis connection
 * failures.
 *
 * @packageDocumentation
 */

import { RedisClient } from "bun";
import RedisMock from "ioredis-mock";
import type { CacheEnvDependenciesDTO } from "./dtos";
import { barista } from "@roastery/barista";

/**
 * Initializes a cache service backed by real Redis or an in-memory mock, and
 * decorates a `@roastery/barista` application with it as `cache`.
 *
 * When `CACHE_PROVIDER` is `"REDIS"` and `REDIS_URL` is provided, a real Bun
 * `RedisClient` is created (with a 1000ms connection timeout). Otherwise —
 * `CACHE_PROVIDER` is `"MEMORY"`, or `REDIS_URL` is missing — the factory
 * falls back to an in-memory `ioredis-mock` instance.
 *
 * @param args - The `CACHE_PROVIDER` and, when applicable, `REDIS_URL` used to
 * pick and configure the backing cache instance.
 * @returns A Barista/Elysia application whose `cache` decorator is typed as
 * {@link BaristaCacheInstance}.
 *
 * @example
 * ```typescript
 * const app = cache({ CACHE_PROVIDER: "REDIS", REDIS_URL: "redis://localhost:6379" });
 * await app.decorator.cache.set("key", "value");
 * ```
 */
export function cache({ CACHE_PROVIDER, REDIS_URL }: CacheEnvDependenciesDTO) {
	return barista().decorate(
		"cache",
		CACHE_PROVIDER === "REDIS" && REDIS_URL
			? (new RedisClient(REDIS_URL, {
					connectionTimeout: 1000,
				}) as BaristaCacheInstance)
			: (new RedisMock() as unknown as BaristaCacheInstance),
	);
}

/**
 * Static type of the cache instance decorated by {@link cache}.
 *
 * Modeled as Bun's native `RedisClient` intersected with an optional
 * `flushall`, since the two providers behind {@link cache} expose different
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

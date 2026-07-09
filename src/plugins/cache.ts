import type { CacheEnvDependenciesDTO } from "@/dtos";
import type { BaristaCacheInstance } from "@/types";
import type { Barista } from "@roastery/barista";
import type { t } from "@roastery/terroir";
import { InvalidEnvironmentException } from "@roastery/terroir/exceptions/infra";
import { RedisClient } from "bun";
import redisMock from "ioredis-mock";

/**
 * Barista plugin that decorates the host app with a `cache` instance, picking
 * the backend from the `CACHE_PROVIDER` environment variable exposed on the
 * app's `env` decorator.
 *
 * @remarks
 * The backend is resolved as follows:
 * - `CACHE_PROVIDER: "REDIS"` — Bun's native `RedisClient`, created with
 *   `connectionTimeout: 1000`. The client is lazy: it only connects when the
 *   first command is issued.
 * - `CACHE_PROVIDER: "MEMORY"` — an `ioredis-mock` instance, ideal for local
 *   development and tests (no Redis server required).
 *
 * If the app already carries a `cache` decorator, that instance is reused
 * instead of creating a new client, making the plugin idempotent across
 * repeated registrations.
 *
 * @typeParam ContentType - Content schemas of the host app, inferred by Barista.
 * @typeParam BasePath - Base path of the host app, inferred by Barista.
 * @param app - The host Barista app whose `env` decorator holds the variables
 * described by {@link CacheEnvDependenciesDTO}.
 * @returns The same app, decorated with `cache: BaristaCacheInstance` (typed
 * as `object` to satisfy the Blend `Plugin` contract).
 * @throws {InvalidEnvironmentException} When `CACHE_PROVIDER` is missing, or
 * when `CACHE_PROVIDER` is `"REDIS"` and `REDIS_URL` is not provided.
 *
 * @example
 * ```typescript
 * import { barista } from "@roastery/barista";
 * import { cache } from "@roastery-adapters/cache/plugins";
 * import { CacheEnvDependenciesDTO } from "@roastery-adapters/cache/dtos";
 *
 * const app = barista({ environmentDTOs: [CacheEnvDependenciesDTO] }).use(cache);
 *
 * await app.decorator.cache.set("greeting", "hello");
 * ```
 *
 * @see {@link BaristaCacheInstance} — the static type of the decorated instance.
 */
export function cache<
	const ContentType extends t.TObject[] = [],
	const BasePath extends string = "",
>(app: Barista<ContentType, BasePath>): object {
	const { CACHE_PROVIDER, REDIS_URL } = app.decorator
		.env as unknown as CacheEnvDependenciesDTO;

	const { cache: cacheInstance } = app.decorator as unknown as {
		cache?: BaristaCacheInstance;
	};

	if (!CACHE_PROVIDER) {
		throw new InvalidEnvironmentException(
			"@roastery::adapters:cache",
			"CACHE_PROVIDER was missing in environment file.",
		);
	}

	if (CACHE_PROVIDER === "REDIS" && !REDIS_URL) {
		throw new InvalidEnvironmentException(
			"@roastery::adapters:cache",
			'REDIS_URL is required when CACHE_PROVIDER is "REDIS".',
		);
	}

	const instance =
		cacheInstance ??
		(CACHE_PROVIDER === "REDIS" && REDIS_URL
			? (new RedisClient(REDIS_URL, {
					connectionTimeout: 1000,
				}) as BaristaCacheInstance)
			: (new redisMock() as unknown as BaristaCacheInstance));

	return app.decorate("cache", instance);
}

import { t } from "@roastery/terroir";
import { CacheProviderDTO } from "./cache-provider.dto";
import { SimpleUrlDTO } from "@roastery/beans/collections/dtos";

/**
 * Configuration schema consumed by the `cache` factory
 * (`@roastery-adapters/cache`).
 *
 * @property CACHE_PROVIDER - Selects the cache backend: `"REDIS"` or
 * `"MEMORY"` (see {@link CacheProviderDTO}).
 * @property REDIS_URL - Redis connection URL. Required for a real Redis
 * connection; when omitted (or `CACHE_PROVIDER` is `"MEMORY"`), the factory
 * falls back to an in-memory mock.
 */
export const CacheEnvDependenciesDTO = t.Object({
	REDIS_URL: t.Optional(SimpleUrlDTO),
	CACHE_PROVIDER: CacheProviderDTO,
});

/**
 * Static type inferred from {@link CacheEnvDependenciesDTO}.
 */
export type CacheEnvDependenciesDTO = t.Static<typeof CacheEnvDependenciesDTO>;

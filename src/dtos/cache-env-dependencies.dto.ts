import { t } from "@roastery/terroir";
import { CacheProviderDTO } from "./cache-provider.dto";
import { SimpleUrlDTO } from "@roastery/beans/collections/dtos";

export const CacheEnvDependenciesDTO = t.Object({
	REDIS_URL: t.Optional(SimpleUrlDTO),
	CACHE_PROVIDER: CacheProviderDTO,
});

export type CacheEnvDependenciesDTO = t.Static<typeof CacheEnvDependenciesDTO>;

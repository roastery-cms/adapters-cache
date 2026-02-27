import { t } from "@caffeine/models";
import { SimpleUrlDTO } from "@caffeine/models/dtos/primitives";
import { CacheProviderDTO } from "./cache-provider.dto";

export const CacheEnvDependenciesDTO = t.Object({
    REDIS_URL: t.Optional(SimpleUrlDTO),
    CACHE_PROVIDER: CacheProviderDTO,
});

export type CacheEnvDependenciesDTO = t.Static<typeof CacheEnvDependenciesDTO>;

import { RedisClient } from "bun";
import RedisMock from "ioredis-mock";
import type { CacheEnvDependenciesDTO } from "./dtos";
import { barista } from "@roastery/barista";

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

export type BaristaCacheInstance = RedisClient;

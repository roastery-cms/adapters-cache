import { RedisClient } from "bun";
import RedisMock from "ioredis-mock";
import type { CacheEnvDependenciesDTO } from "./dtos";
import { barista } from "@roastery/barista";

export function CaffeineCache({
	CACHE_PROVIDER,
	REDIS_URL,
}: CacheEnvDependenciesDTO) {
	return barista().decorate(
		"cache",
		CACHE_PROVIDER === "REDIS" && REDIS_URL
			? (new RedisClient(REDIS_URL, {
					connectionTimeout: 1000,
				}) as CaffeineCacheInstance)
			: (new RedisMock() as unknown as CaffeineCacheInstance),
	);
}

export type CaffeineCacheInstance = RedisClient;

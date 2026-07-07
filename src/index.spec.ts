import { describe, expect, it } from "bun:test";
import { RedisClient } from "bun";
import RedisMock from "ioredis-mock";
import { cache } from "./index";

describe("cache", () => {
	describe("quando CACHE_PROVIDER é MEMORY", () => {
		it("decora a instância com um RedisMock que expõe flushall", () => {
			const app = cache({ CACHE_PROVIDER: "MEMORY" });

			expect(app.decorator.cache).toBeInstanceOf(RedisMock);
			expect(typeof app.decorator.cache.flushall).toBe("function");
		});

		it("flushall remove todas as chaves armazenadas", async () => {
			const app = cache({ CACHE_PROVIDER: "MEMORY" });
			const cacheInstance = app.decorator.cache;

			await cacheInstance.set("foo", "bar");
			expect(await cacheInstance.get("foo")).toBe("bar");

			await cacheInstance.flushall?.();

			expect(await cacheInstance.get("foo")).toBeNull();
		});
	});

	describe("quando CACHE_PROVIDER é REDIS", () => {
		it("decora a instância com o RedisClient do Bun quando REDIS_URL é informado", () => {
			const app = cache({
				CACHE_PROVIDER: "REDIS",
				REDIS_URL: "redis://localhost:6379",
			});

			expect(app.decorator.cache).toBeInstanceOf(RedisClient);
		});

		it("cai para o RedisMock quando REDIS_URL não é informado", () => {
			const app = cache({ CACHE_PROVIDER: "REDIS" });

			expect(app.decorator.cache).toBeInstanceOf(RedisMock);
		});
	});
});

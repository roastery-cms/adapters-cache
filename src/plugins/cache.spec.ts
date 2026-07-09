import type { BaristaCacheInstance } from "@/types";
import type { Barista } from "@roastery/barista";
import { InvalidEnvironmentException } from "@roastery/terroir/exceptions/infra";
import { describe, expect, it } from "bun:test";
import { RedisClient } from "bun";
import RedisMock from "ioredis-mock";
import { cache } from "./cache";

type FakeApp = {
	decorator: Record<string, unknown> & { env: Record<string, unknown> };
	decorate: (key: string, value: unknown) => FakeApp;
};

function makeApp(
	env: Record<string, unknown>,
	decorators: Record<string, unknown> = {},
): FakeApp {
	const app: FakeApp = {
		decorator: { env, ...decorators },
		decorate(key, value) {
			app.decorator[key] = value;
			return app;
		},
	};

	return app;
}

const asBarista = (app: FakeApp) => app as unknown as Barista;

describe("cache plugin", () => {
	describe("quando CACHE_PROVIDER é MEMORY", () => {
		it("decora o app com um RedisMock mesmo sem REDIS_URL", () => {
			const app = makeApp({ CACHE_PROVIDER: "MEMORY" });

			cache(asBarista(app));

			expect(app.decorator.cache).toBeInstanceOf(RedisMock);
		});

		it("flushall remove todas as chaves armazenadas", async () => {
			const app = makeApp({ CACHE_PROVIDER: "MEMORY" });
			cache(asBarista(app));
			const instance = app.decorator.cache as BaristaCacheInstance;

			await instance.set("foo", "bar");
			expect(await instance.get("foo")).toBe("bar");

			await instance.flushall?.();

			expect(await instance.get("foo")).toBeNull();
		});
	});

	describe("quando CACHE_PROVIDER é REDIS", () => {
		it("decora o app com o RedisClient do Bun quando REDIS_URL é informado", () => {
			const app = makeApp({
				CACHE_PROVIDER: "REDIS",
				REDIS_URL: "redis://localhost:6379",
			});

			cache(asBarista(app));

			expect(app.decorator.cache).toBeInstanceOf(RedisClient);
			(app.decorator.cache as RedisClient).close();
		});

		it("lança InvalidEnvironmentException quando REDIS_URL está ausente", () => {
			const app = makeApp({ CACHE_PROVIDER: "REDIS" });

			expect(() => cache(asBarista(app))).toThrow(InvalidEnvironmentException);
		});
	});

	describe("quando CACHE_PROVIDER está ausente", () => {
		it("lança InvalidEnvironmentException", () => {
			const app = makeApp({});

			expect(() => cache(asBarista(app))).toThrow(InvalidEnvironmentException);
		});
	});

	describe("quando já existe uma instância de cache no decorator", () => {
		it("reaproveita a instância existente em vez de criar outra", () => {
			const existing = new RedisMock() as unknown as BaristaCacheInstance;
			const app = makeApp(
				{ CACHE_PROVIDER: "REDIS", REDIS_URL: "redis://localhost:6379" },
				{ cache: existing },
			);

			cache(asBarista(app));

			expect(app.decorator.cache).toBe(existing);
			expect(app.decorator.cache).not.toBeInstanceOf(RedisClient);
		});
	});
});

import { CacheUnavailableException } from "@roastery/terroir/exceptions/infra";
import { describe, expect, it } from "bun:test";
import { SafeCache } from "./safe-cache.decorator";

class CacheRepositoryFixture {
	@SafeCache()
	async succeeds(value: string): Promise<string> {
		return `ok:${value}`;
	}

	@SafeCache("CustomLayer")
	async failsWithCode(code: string): Promise<never> {
		const error = new Error(`redis failure: ${code}`) as Error & {
			code: string;
		};
		error.code = code;
		throw error;
	}

	@SafeCache()
	async failsGeneric(): Promise<never> {
		throw new Error("generic failure");
	}
}

describe("SafeCache", () => {
	const repository = new CacheRepositoryFixture();

	it("retorna o valor do método original quando não há erro", async () => {
		expect(await repository.succeeds("value")).toBe("ok:value");
	});

	it.each([
		"ERR_REDIS_CONNECTION_CLOSED",
		"ERR_REDIS_AUTHENTICATION_FAILED",
		"ERR_REDIS_INVALID_RESPONSE",
	])("converte %s em CacheUnavailableException com o código como mensagem", async (code) => {
		const error = await repository.failsWithCode(code).catch((e) => e);

		expect(error).toBeInstanceOf(CacheUnavailableException);
		expect((error as CacheUnavailableException).source).toBe("CustomLayer");
		expect((error as CacheUnavailableException).message).toBe(code);
	});

	it("converte erros genéricos usando a mensagem original", async () => {
		const error = await repository.failsGeneric().catch((e) => e);

		expect(error).toBeInstanceOf(CacheUnavailableException);
		expect((error as CacheUnavailableException).message).toBe(
			"generic failure",
		);
	});

	it("usa o nome da classe como layerName padrão", async () => {
		const error = await repository.failsGeneric().catch((e) => e);

		expect((error as CacheUnavailableException).source).toBe(
			"CacheRepositoryFixture",
		);
	});
});

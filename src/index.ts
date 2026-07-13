import { Blend, type Owner, type Plugin, type Tag, type Version } from "@roastery/blend";
import type { t } from "@roastery/terroir";
import { CacheEnvDependenciesDTO } from "./dtos";
import { cache } from "./plugins";

/**
 * Capsule manifest of the cache adapter for the Roastery ecosystem.
 *
 * @remarks
 * `Cache` is a declarative identity card, not a behavior carrier: the
 * orchestration layer reads it to validate the host environment and register
 * the adapter. Its contract is:
 * - `environmentNeeds` — {@link CacheEnvDependenciesDTO}: `CACHE_PROVIDER`
 *   (`"REDIS" | "MEMORY"`, required) and `REDIS_URL` (required only when the
 *   provider is `"REDIS"`).
 * - `plugin` — the {@link cache} function, which decorates the host Barista
 *   app with a `cache: BaristaCacheInstance`.
 * - `dependencies` — empty: this is a standalone capsule with no other
 *   Blend requirements.
 *
 * @example
 * ```typescript
 * import { Cache } from "@roastery-adapters/cache";
 *
 * const manifest = new Cache();
 *
 * // The orchestrator validates `manifest.environmentNeeds` against the
 * // environment, then registers `manifest.plugin` on the host app.
 * app.use(manifest.plugin);
 * ```
 *
 * @see {@link cache} — the plugin registered by this capsule.
 * @see {@link CacheEnvDependenciesDTO} — the environment schema it requires.
 */
export class Cache extends Blend {
	override name = "@roastery-adapters/cache";
	override version: Version = `0.1.0`;
	override owner: Owner = {
		name: "Alan Reis Anjos",
		email: "alanreisanjo@gmail.com",
		repository: "https://github.com/roastery-cms/adapters-cache",
	};
	override license: string = "MIT";
	override environmentNeeds: t.TSchema = CacheEnvDependenciesDTO;
	override plugin: Plugin = cache;
    override dependencies = {};
	override tag?: Tag | undefined = undefined;
}

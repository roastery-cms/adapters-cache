# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@roastery-adapters/cache` is a small standalone library (not an app) providing a Redis/in-memory cache adapter for the Roastery CMS ecosystem. It has no `src/domain`/`src/application`/`src/infra` layering — it's a flat library with four public subpaths built by `tsup` into `dist/` as dual ESM+CJS with `.d.ts`.

## Commands

```bash
bun run test:unit       # bun test --env-file=.env.testing
bun run test:coverage   # bun test --env-file=.env.testing --coverage
bun run build           # biome check --fix && tsup (ESM+CJS+dts) into dist/
bun run knip            # unused exports/dependencies check
bun run setup           # knip + build + bun link
```

Run a single test file: `bun test src/plugins/cache.spec.ts --env-file=.env.testing`.

Unit tests use the `MEMORY` provider and need no external services. To exercise the real `REDIS` provider, start the bundled container first: `docker compose up -d` (redis:alpine on `localhost:6379`).

There is no separate lint script — Biome runs as part of `build` (`biome check --fix`). Run `biome check` directly (native CLI, not via bun/npm) if you want to check without building.

## Architecture

Four public subpath exports, one concept each:

- **`.` (root)** — `Cache`, a `@roastery/blend` capsule manifest class (`src/index.ts`). It carries no runtime behavior; it's a declarative identity card (`name`, `version`, `owner`, `environmentNeeds`, `plugin`, `dependencies`) that the Blend orchestration layer reads to validate the host environment and register the plugin below.
- **`./plugins`** — `cache` (`src/plugins/cache.ts`), a Barista plugin function `(app: Barista) => app.decorate("cache", instance)`. It reads `CACHE_PROVIDER`/`REDIS_URL` off `app.decorator.env` and picks the backend:
  - `"REDIS"` → Bun's native `RedisClient` (lazy-connects on first command, `connectionTimeout: 1000`).
  - `"MEMORY"` → an `ioredis-mock` instance (no server needed).
  - If `app.decorator.cache` already exists, it's reused as-is — the plugin is idempotent across repeated `.use(cache)` calls.
  - Throws `InvalidEnvironmentException` (`@roastery/terroir/exceptions/infra`) if `CACHE_PROVIDER` is missing, or if it's `"REDIS"` without `REDIS_URL`.
- **`./decorators`** — `SafeCache` (`src/decorators/safe-cache.decorator.ts`), a method decorator that wraps async methods in try/catch, converting known Redis error codes (`ERR_REDIS_CONNECTION_CLOSED`, `ERR_REDIS_AUTHENTICATION_FAILED`, `ERR_REDIS_INVALID_RESPONSE`) — and any other error — into `CacheUnavailableException`. `layerName` defaults to `target.constructor.name`.
- **`./types`** — `BaristaCacheInstance` (`src/types/barista-cache-instance.ts`): Bun's `RedisClient` intersected with an optional `flushall`. Real `RedisClient` (REDIS provider) has no `flushall`; `ioredis-mock` (MEMORY provider) does. Always guard as `cacheInstance.flushall?.()`.
- **`./dtos`** — TypeBox schemas: `CacheProviderDTO` (`"REDIS" | "MEMORY"`) and `CacheEnvDependenciesDTO` (`{ CACHE_PROVIDER, REDIS_URL? }`), the `environmentNeeds` the `Cache` capsule declares.

Path alias `@/*` → `./src/*` (see `tsconfig.json`); subpath exports map `./*` → `dist/*/index.{js,cjs,d.ts}` (see `package.json` `exports`/`typesVersions`), so every subfolder under `src/` needs its own `index.ts` barrel.

## Testing conventions

- Test runner is **`bun:test`**, not vitest — import `describe`/`expect`/`it` from `"bun:test"`. Specs are colocated as `src/**/*.spec.ts`.
- Do **not** construct a real `barista()` app in tests for invalid-env cases: the real `env` plugin from `@roastery/barista` calls `process.exit(1)` on validation failure, which kills the whole `bun test` process. Instead use a minimal fake app (see `src/plugins/cache.spec.ts`): `{ decorator: { env, ...decorators }, decorate(key, value) {...} }` cast `as unknown as Barista`.
- Test descriptions are written in Portuguese (`describe("quando ...", ...)`), matching the existing spec files.

## The `.agent` submodule

`.agent/` is a git submodule (`caffeine-js/agent-guide`) with generic rules/workflows for a broader multi-layer (domain/application/infra/presentation) TypeScript ecosystem. It does **not** describe this repo accurately: its `use-vitest.md` rule is stale here (this repo uses `bun test`), and its DDD-layer review workflows (`review-domain`, `review-infra`, etc.) assume a folder structure (`src/domain`, `src/application`) that doesn't exist in this library. Prefer `.agent/.agent/workflows/review-lib.md` framing (API surface / DX / modularity) if asked to review this codebase, and trust the real config in this repo (`bunfig.toml`, `package.json` scripts) over the submodule's rules where they conflict.

## Commit conventions

Conventional Commits, enforced by commitlint via a husky `commit-msg` hook (`bun commitlint --edit`). Recent commit style: `feat: 0.0.6`, `feat!: 0.1.0` (breaking change marker), `chore: add docker compose file`.

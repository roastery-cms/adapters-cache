# @roastery-adapters/cache

Redis and in-memory cache adapter with safe error handling for the [Roastery CMS](https://github.com/roastery-cms) ecosystem.

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

## Overview

**@roastery-adapters/cache** provides four primitives for integrating cache into Roastery-based applications:

- **`Cache` capsule** — A [`@roastery/blend`](https://github.com/roastery-cms) capsule manifest (package root export) that declares the adapter's identity, environment needs, and plugin so the orchestration layer can validate and register it.
- **`cache` plugin** — A Barista plugin (`/plugins` subpath) that decorates the host app with a Redis or in-memory cache instance based on the `CACHE_PROVIDER` environment variable.
- **`SafeCache` decorator** — A method decorator (`/decorators` subpath) that wraps async methods with structured error handling for Redis connection failures, converting them into typed `CacheUnavailableException` errors.
- **`BaristaCacheInstance` type** — The static type (`/types` subpath) of the decorated cache instance.

## Technologies

| Tool | Purpose |
|------|---------|
| [Bun](https://bun.sh) | Native `RedisClient`, runtime, test runner, and package manager |
| [@roastery/blend](https://github.com/roastery-cms) | Capsule manifest contract (`Blend`, `Plugin`) |
| [@roastery/barista](https://github.com/roastery-cms) | Host app abstraction (Elysia-based) with typed `env` decorator |
| [@roastery/terroir](https://github.com/roastery-cms) | Typed exceptions and TypeBox schemas |
| [ioredis-mock](https://github.com/stipsan/ioredis-mock) | In-memory Redis mock for development and testing |
| [tsup](https://tsup.egoist.dev) | Bundling to ESM + CJS with `.d.ts` generation |
| [Knip](https://knip.dev) | Unused exports and dependency detection |
| [Husky](https://typicode.github.io/husky) + [commitlint](https://commitlint.js.org) | Git hooks and conventional commit enforcement |

## Installation

```bash
bun add @roastery-adapters/cache
```

The `@roastery/*` runtime packages (`barista`, `beans`, `blend`, `terroir`) are regular dependencies and install automatically.

**Peer dependencies** (provided by your project):

```bash
bun add -d typescript tsup @types/bun
```

---

## Cache capsule (Blend)

The package root exports the `Cache` class, a `@roastery/blend` capsule manifest. It carries no behavior — it is a declarative identity card the orchestration layer reads to validate the host environment (`environmentNeeds`) and register the adapter (`plugin`).

```typescript
import { Cache } from '@roastery-adapters/cache';

const manifest = new Cache();

// The orchestrator validates `manifest.environmentNeeds` against the
// environment, then registers `manifest.plugin` on the host app.
app.use(manifest.plugin);
```

| Field | Value |
|-------|-------|
| `name` | `@roastery-adapters/cache` |
| `environmentNeeds` | `CacheEnvDependenciesDTO` (see [Environment variables](#environment-variables)) |
| `plugin` | The [`cache` plugin](#cache-plugin) |
| `dependencies` | None — standalone capsule |

---

## cache plugin

`cache` is a Barista plugin: it receives the host app, reads `CACHE_PROVIDER`/`REDIS_URL` from the app's typed `env` decorator, and decorates the app with a `cache` instance.

```typescript
import { barista } from '@roastery/barista';
import { cache } from '@roastery-adapters/cache/plugins';
import { CacheEnvDependenciesDTO } from '@roastery-adapters/cache/dtos';

const app = barista({ environmentDTOs: [CacheEnvDependenciesDTO] }).use(cache);

await app.decorator.cache.set('greeting', 'hello');
```

Backend selection:

- `CACHE_PROVIDER: "REDIS"` — Bun's native `RedisClient`, created with `connectionTimeout: 1000`. The client is lazy: it only connects when the first command is issued. Requires `REDIS_URL`.
- `CACHE_PROVIDER: "MEMORY"` — an `ioredis-mock` instance; no Redis server required.

If the app already carries a `cache` decorator, the plugin reuses that instance instead of creating a new client, making it idempotent across repeated registrations.

The decorated instance is typed as `BaristaCacheInstance` (from `@roastery-adapters/cache/types`): Bun's `RedisClient` intersected with an optional `flushall`. When the `MEMORY` provider is used, the underlying `ioredis-mock` instance really implements `flushall(): Promise<"OK">`, which is handy for clearing all keys (e.g. between test cases). With the `REDIS` provider, the instance is Bun's native `RedisClient`, which doesn't have `flushall` (only `send`), so the field is optional and should be accessed as `cacheInstance.flushall?.()`.

---

## SafeCache decorator

`SafeCache` is a method decorator that catches Redis connection errors and re-throws them as `CacheUnavailableException` from `@roastery/terroir`.

```typescript
import { SafeCache } from '@roastery-adapters/cache/decorators';

class UserCacheRepository {
  @SafeCache('UserCacheRepository')
  async get(key: string) {
    return this.cache.get(key);
  }
}
```

The optional `layerName` parameter sets the context name included in the exception. If omitted, it defaults to the class name (`target.constructor.name`).

**Handled error codes:**

| Code | Cause |
|------|-------|
| `ERR_REDIS_CONNECTION_CLOSED` | Redis connection was closed |
| `ERR_REDIS_AUTHENTICATION_FAILED` | Authentication to Redis failed |
| `ERR_REDIS_INVALID_RESPONSE` | Redis returned an unexpected response |

All matched errors are re-thrown as `CacheUnavailableException`. Unrecognized errors are also wrapped.

---

## Environment variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `CACHE_PROVIDER` | `"REDIS" \| "MEMORY"` | Yes | Selects the cache backend |
| `REDIS_URL` | `string` (URL) | Only when `CACHE_PROVIDER` is `"REDIS"` | Redis connection URL |

A missing `CACHE_PROVIDER` — or a missing `REDIS_URL` when the provider is `"REDIS"` — makes the plugin throw `InvalidEnvironmentException`.

---

## Exports reference

```typescript
import { Cache } from '@roastery-adapters/cache';                         // Blend capsule manifest
import { cache } from '@roastery-adapters/cache/plugins';                 // Barista plugin
import type { BaristaCacheInstance } from '@roastery-adapters/cache/types'; // RedisClient type + optional flushall (MEMORY provider)
import { SafeCache } from '@roastery-adapters/cache/decorators';          // safe method decorator
import { CacheEnvDependenciesDTO } from '@roastery-adapters/cache/dtos';  // env schema + type
import { CacheProviderDTO } from '@roastery-adapters/cache/dtos';         // "REDIS" | "MEMORY" schema + type
```

---

## Development

```bash
# Run tests
bun run test:unit

# Run tests with coverage
bun run test:coverage

# Build for distribution
bun run build

# Check for unused exports and dependencies
bun run knip

# Full setup (knip + build + bun link)
bun run setup
```

Unit tests use the `MEMORY` provider and need no external services. To exercise the `REDIS` provider against a real server, start the bundled Redis container:

```bash
docker compose up -d   # redis:alpine on localhost:6379
```

## License

MIT

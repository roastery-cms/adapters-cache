# @roastery-adapters/cache

Redis and in-memory cache adapter with safe error handling for the [Roastery CMS](https://github.com/roastery-cms) ecosystem.

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

## Overview

**@roastery-adapters/cache** provides two core primitives for integrating cache into Roastery-based applications:

- **Cache factory** — A factory function (`cache`) that initializes a Redis or in-memory mock cache service, integrated with Roastery's dependency injection system via `@roastery/barista`.
- **Safe decorator** — A method decorator (`SafeCache`) that wraps async methods with structured error handling for Redis connection failures, converting them into typed `CacheUnavailableException` errors.

## Technologies

| Tool | Purpose |
|------|---------|
| [Bun](https://bun.sh) | Native `RedisClient`, runtime, test runner, and package manager |
| [ioredis-mock](https://github.com/stipsan/ioredis-mock) | In-memory Redis mock for development and testing |
| [tsup](https://tsup.egoist.dev) | Bundling to ESM + CJS with `.d.ts` generation |
| [Knip](https://knip.dev) | Unused exports and dependency detection |
| [Husky](https://typicode.github.io/husky) + [commitlint](https://commitlint.js.org) | Git hooks and conventional commit enforcement |

## Installation

```bash
bun add @roastery-adapters/cache
```

**Peer dependencies** (install alongside):

```bash
bun add @roastery/barista @roastery/terroir @roastery/beans
```

---

## Cache factory

`cache` initializes a cache service backed by real Redis or an in-memory mock, depending on the provided configuration. It is decorated with `@roastery/barista` for dependency injection.

```typescript
import { cache } from '@roastery-adapters/cache';

const cache = cache({
  CACHE_PROVIDER: 'REDIS',
  REDIS_URL: 'redis://localhost:6379',
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `CACHE_PROVIDER` | `"REDIS" \| "MEMORY"` | Yes | Selects the cache backend |
| `REDIS_URL` | `string` (URL) | No | Redis connection URL (required when `CACHE_PROVIDER` is `"REDIS"`) |

When `CACHE_PROVIDER` is `"MEMORY"` or `REDIS_URL` is not provided, the factory falls back to an in-memory mock (`ioredis-mock`).

The returned instance is typed as `cacheInstance` (alias for Bun's `RedisClient`).

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

## Exports reference

```typescript
import { cache } from '@roastery-adapters/cache';              // cache factory function
import type { cacheInstance } from '@roastery-adapters/cache'; // RedisClient type alias
import { SafeCache } from '@roastery-adapters/cache/decorators';       // safe method decorator
import { CacheEnvDependenciesDTO } from '@roastery-adapters/cache/dtos'; // config schema + type
import { CacheProviderDTO } from '@roastery-adapters/cache/dtos';      // "REDIS" | "MEMORY" schema + type
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

# Full setup (build + bun link)
bun run setup
```

## License

MIT

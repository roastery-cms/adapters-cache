# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1]

### Changed

- Bumped `@roastery/blend` from `^0.0.2` to `^0.0.3`

## [0.1.0]

### Added

- `Cache` class — a `@roastery/blend` capsule manifest (`name`, `version`, `owner`, `license`, `environmentNeeds`, `plugin`) exported from the package root
- `@roastery/blend` (`^0.0.2`) as a dependency
- New subpath exports: `@roastery-adapters/cache/plugins` (the `cache` plugin) and `@roastery-adapters/cache/types` (`BaristaCacheInstance`)
- Unit tests for the `cache` plugin and the `SafeCache` decorator

### Changed

- **Breaking:** `cache` is now a Blend `Plugin` — it receives a `Barista` app and reads `CACHE_PROVIDER`/`REDIS_URL` from the app's typed `env` decorator instead of taking a configuration object; import it from `@roastery-adapters/cache/plugins` (the package root now exports the `Cache` capsule)
- **Breaking:** `CACHE_PROVIDER: "REDIS"` without `REDIS_URL` now throws `InvalidEnvironmentException` instead of silently falling back to the in-memory mock; `MEMORY` no longer requires `REDIS_URL`
- **Breaking:** `BaristaCacheInstance` moved from the package root to `@roastery-adapters/cache/types`
- `cache` reuses a pre-existing `cache` decorator instance instead of always creating a new client
- Bumped `@roastery/barista` from `^0.0.5` to `^0.1.1`, `@roastery/beans` from `^0.0.4` to `^0.1.1`, and `@roastery/terroir` from `^0.0.9` to `^0.1.0`

## [0.0.6]

### Added

- Added optional `flushall` method to `BaristaCacheInstance` typing, reflecting the MEMORY provider's `ioredis`-compatible instance

### Changed

- Moved `@roastery/barista`, `@roastery/beans`, and `@roastery/terroir` from `peerDependencies` to `dependencies` for automatic installation
- Bumped `@roastery/beans` from `^0.0.2` to `^0.0.4`
- Added `bun knip` step to the `setup` script for unused code detection before build

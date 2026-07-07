# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.6]

### Added

- Added optional `flushall` method to `BaristaCacheInstance` typing, reflecting the MEMORY provider's `ioredis`-compatible instance

### Changed

- Moved `@roastery/barista`, `@roastery/beans`, and `@roastery/terroir` from `peerDependencies` to `dependencies` for automatic installation
- Bumped `@roastery/beans` from `^0.0.2` to `^0.0.4`
- Added `bun knip` step to the `setup` script for unused code detection before build

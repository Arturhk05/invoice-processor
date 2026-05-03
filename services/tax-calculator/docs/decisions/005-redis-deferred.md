# 005 — Redis: Deferred Until Compliance Service

**Date:** 2026-05-02

## Decision

Do not add Redis in v1. Use in-memory cache for fiscal rates. Introduce Redis when the Compliance Service is implemented.

## Why

The Compliance Service (planned) will use Redis pub/sub for real-time compliance alerts. Adding Redis to `docker-compose.yml` now, used only by a single in-memory rate cache, would leave infrastructure partially utilized. In-memory caching is entirely sufficient for fixed fiscal rates that do not change between runs.

## Options Considered

| Option | Rejected because |
| --- | --- |
| **In-memory cache for v1** ✅ | Zero infrastructure overhead; fixed rates do not require persistence or shared cache |
| Redis now | Adds a container to docker-compose that serves only one low-value use case; deferred until a real need exists |
| No cache at all | Acceptable for fixed rates but forecloses the pattern when real lookups are added |

## Key choices

- Rate cache is abstracted behind an `IRateCache` interface — the in-memory implementation is swappable for a Redis implementation without touching callers
- Redis will be introduced in the same PR as the Compliance Service — a single docker-compose change covers both services
- Cache TTL strategy and invalidation rules will be designed when the real use case (mutable rates) materializes

## Consequences

- docker-compose.yml stays lean in v1 — only PostgreSQL and RabbitMQ
- When Redis is added for the Compliance Service, the tax-calculator can optionally switch to the Redis cache implementation with a one-line change at the wiring site in `main.ts`
- No Redis operational overhead (monitoring, memory limits, eviction policy) until it is genuinely needed

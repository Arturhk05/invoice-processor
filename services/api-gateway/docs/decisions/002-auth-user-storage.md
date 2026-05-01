# 002 — Auth User Storage Strategy

**Date:** 2026-05-01

## Decision

Gateway validates JWT tokens only. User management is not a gateway responsibility. For now, users are stored in-memory behind an interface (`UserRepository`) so the implementation can be swapped later without touching guards or strategies.

## Why

The gateway is stateless by designm, it authenticates requests and routes them. Owning a users table would couple it to persistence concerns that belong to a dedicated identity service.

## Options Considered

| Option                             | Rejected because                                                            |
| ---------------------------------- | --------------------------------------------------------------------------- |
| PostgreSQL in the gateway          | Couples gateway to DB; user management is not its responsibility            |
| In-memory hardcoded (no interface) | Works now but requires rewriting guards/strategies when swapped             |
| **Interface + in-memory impl** ✅  | Isolates the swap point; gateway logic stays unchanged when storage changes |

## Consequences

- `UserRepository` interface defined in `modules/auth/ports/`
- In-memory implementation injected via NestJS DI
- When a real identity service exists, only the implementation swaps — no changes to JWT strategy or guards

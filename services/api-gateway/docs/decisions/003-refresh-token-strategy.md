# 003 — Refresh Token Strategy

**Date:** 2026-05-01

## Decision

Use a simple refresh token, separate token with longer TTL, stored in-memory, no rotation.

## Why

Token rotation requires a blacklist (Redis or DB) to invalidate used tokens. That infrastructure doesn't exist yet and adds unnecessary complexity for now. A simple refresh token balances security and implementation cost.

## Options Considered

| Option                               | Rejected because                                                            |
| ------------------------------------ | --------------------------------------------------------------------------- |
| No refresh (long-lived access token) | Insecure — compromised token valid until expiry with no revocation path     |
| **Simple refresh token** ✅          | Separates short-lived access from long-lived refresh; no extra infra needed |
| Rotating refresh tokens              | Requires blacklist store (Redis/DB) — premature complexity at this stage    |

## Token TTLs

| Token   | TTL  | Env var                  |
| ------- | ---- | ------------------------ |
| Access  | `1h` | `JWT_EXPIRATION`         |
| Refresh | `7d` | `JWT_REFRESH_EXPIRATION` |

## Consequences

- Two JWT secrets: `JWT_SECRET` (access) and `JWT_REFRESH_SECRET` (refresh)
- Two Passport strategies: `JwtStrategy` and `JwtRefreshStrategy`
- Refresh tokens stored in-memory behind `RefreshTokenRepository` interface, swappable to Redis later
- `env.validation.ts` and `configuration.ts` updated with new vars

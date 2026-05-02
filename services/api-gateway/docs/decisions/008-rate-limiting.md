# 008 — Rate Limiting Strategy

**Date:** 2026-05-01  
**Status:** Accepted

## Decision

Per-endpoint rate limiting using `@nestjs/throttler`, keyed by IP.

## Limits

| Endpoint             | Requests | Window | Reason                   |
| -------------------- | -------- | ------ | ------------------------ |
| `POST /auth/login`   | 5        | 1 min  | Brute force protection   |
| `POST /auth/refresh` | 10       | 1 min  | Token abuse protection   |
| Global (all others)  | 100      | 1 min  | General abuse protection |

## Why per-endpoint

Login is the primary brute force target. A global limit loose enough for normal use (100 req/min) would still allow thousands of password attempts per hour. Login needs its own tight limit.

## Options Considered

| Option                   | Rejected because                                     |
| ------------------------ | ---------------------------------------------------- |
| Global only              | Too loose for login, too strict for normal endpoints |
| **Per-endpoint** ✅      | Right limit for right endpoint                       |
| Per-user (authenticated) | Login is pre-auth — can't key by user ID there       |

## Consequences

- `ThrottlerModule` configured globally in `AppModule` with default (100 req/min)
- `@Throttle()` decorator overrides per endpoint
- `429 Too Many Requests` returned when limit exceeded — same error shape as other errors
- Keyed by IP — no storage required (in-memory)

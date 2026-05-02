# 007 — Logging Strategy

**Date:** 2026-05-01

## Decision

Use `nestjs-pino` with JSON-only output across all environments. Log method, path, status, duration, requestId, user ID (if authenticated), and IP per request.

## Options Considered

| Option                | Rejected because                                                       |
| --------------------- | ---------------------------------------------------------------------- |
| NestJS default logger | Not structured JSON and not parseable by log aggregators               |
| winston               | More config, slower than pino                                          |
| **nestjs-pino** ✅    | Pino is fastest Node.js logger, native JSON, integrates with NestJS DI |

## Log shape (per request)

```json
{
  "level": "info",
  "time": 1234567890,
  "requestId": "uuid-v4",
  "method": "POST",
  "path": "/auth/login",
  "statusCode": 200,
  "duration": "12ms",
  "userId": "1",
  "ip": "127.0.0.1"
}
```

## Format

JSON only — consistent between development and production. No pretty-print.

## Why

Pretty-print in dev adds a `pino-pretty` dependency and diverges dev/prod behavior. JSON is readable enough with tools like `jq` or any log viewer.

## Consequences

- `nestjs-pino` + `pino-http` installed
- `LoggerModule` configured globally in `AppModule`
- `LoggingInterceptor` adds `requestId` header to response and injects user context
- `requestId` generated per request via `crypto.randomUUID()`

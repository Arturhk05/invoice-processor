# 001 — Environment Variable Validation at Boot

**Date:** 2026-05-01  

## Decision

Use `@nestjs/config` with a Joi schema to validate all environment variables when the application boots.

## Why

Without validation, missing or malformed env vars cause runtime errors deep in the application, difficult to trace and potentially in production. 

## Options Considered

| Option | Rejected because |
|--------|-----------------|
| Access `process.env` directly | No validation, no types, errors at runtime |
| Custom validation in `main.ts` | Boilerplate, not integrated with NestJS DI |
| `class-validator` on a config class | More verbose for flat env var shape; Joi is simpler here |
| **`@nestjs/config` + Joi** ✅ | Native NestJS integration, declarative schema, global access via `ConfigService` |

## Key choices

- `abortEarly: false` — reports all invalid vars at once instead of stopping at the first
- `isGlobal: true` — `ConfigService` injectable anywhere without re-importing `ConfigModule`
- Typed factory (`configuration.ts`) — maps flat env vars to a nested typed object, avoiding raw string keys spread across the codebase

## Consequences

- App will not start if any required var is missing or invalid
- All config access goes through `ConfigService`, never `process.env` directly
- Adding a new env var requires updating both `env.validation.ts` and `configuration.ts`

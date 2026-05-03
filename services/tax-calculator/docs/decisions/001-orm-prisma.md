# 001 — ORM: Prisma over TypeORM

**Date:** 2026-05-02

## Decision

Use Prisma as the ORM for all database access in the tax-calculator service.

## Why

Prisma's declarative `.prisma` schema provides strong type-safety end-to-end — from database schema to TypeScript types — with zero manual type maintenance. TypeORM has a historical track record of subtle migration bugs and less predictable behavior with complex schemas.

## Options Considered

| Option | Rejected because |
| --- | --- |
| **Prisma** ✅ | Superior DX, strong type-safety via generated client, automatic migrations, reliable migration history |
| TypeORM | Historically prone to migration bugs; decorator-based approach adds runtime magic; less predictable schema sync |

## Key choices

- Schema defined in `prisma/schema.prisma` — single source of truth for DB structure and generated types
- Migrations generated via `prisma migrate dev` — no hand-written SQL
- `PrismaClient` injected as a dependency — testable via mock or test database

## Consequences

- All database changes go through `prisma migrate` — no ad-hoc SQL applied directly to the database
- TypeScript types for all models are auto-generated and stay in sync with the schema
- Switching ORM in the future requires replacing the `PrismaClient` dependency and rewriting repository implementations only — domain logic is unaffected

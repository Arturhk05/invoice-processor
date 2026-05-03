# 007 — Database: Shared PostgreSQL with Separate Schema

**Date:** 2026-05-02

## Decision

Use the existing `invoice_processor` PostgreSQL instance from docker-compose, but isolate tax-calculator data under a dedicated `tax_calculator` schema.

## Why

The project runs as a single docker-compose stack. Adding a second PostgreSQL container for the tax-calculator would double the memory and startup overhead without providing meaningful isolation in a local/portfolio environment. A PostgreSQL schema achieves logical isolation — tables, sequences, and migrations are scoped to `tax_calculator` — while sharing the same container.

## Options Considered

| Option | Rejected because |
| --- | --- |
| **Shared PostgreSQL, separate schema** ✅ | Logical isolation with zero infrastructure overhead; migration to a dedicated DB is trivial |
| Dedicated `tax_calculator_db` container | Unnecessary resource cost for a single docker-compose environment; two containers to manage, monitor, and back up |
| Shared schema (same as ingestion-service) | No isolation; table name collisions possible; makes ownership ambiguous |

## Key choices

- All Prisma migrations run with `search_path=tax_calculator` — no cross-schema table access
- `DATABASE_URL` points to the same PostgreSQL host but includes `?schema=tax_calculator` in the connection string
- Schema creation (`CREATE SCHEMA IF NOT EXISTS tax_calculator`) is part of the initial migration

## Consequences

- A single PostgreSQL container serves both ingestion-service and tax-calculator
- Data is logically isolated — a query in one service cannot accidentally read the other's tables without an explicit schema prefix
- Migrating to a dedicated database in production requires only changing `DATABASE_URL` and removing the `?schema=` parameter — no application code changes

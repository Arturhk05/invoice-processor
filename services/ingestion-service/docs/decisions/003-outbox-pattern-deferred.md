# 003 — Outbox Pattern: Deferred

**Date:** 2026-05-02

## Decision

Initial implementation persists the invoice to PostgreSQL and publishes to RabbitMQ sequentially in the same use case. The Transactional Outbox Pattern is deferred.

## Why

The Outbox Pattern adds meaningful complexity (outbox table, async publisher goroutine, polling loop, at-least-once delivery handling). Implementing it before the basic flow is validated increases risk with no immediate benefit during development.

## Options Considered

| Option | Rejected because |
|--------|-----------------|
| **Sequential persist → publish (no outbox)** ✅ | Simple, correct for current stage, easy to reason about |
| Outbox Pattern from day one | Premature complexity before basic flow is validated |
| RabbitMQ-only (no DB persistence) | Loses invoice data if RabbitMQ is unavailable |

## Current behaviour (without Outbox)

```
POST /invoices
  → save invoice to PostgreSQL
  → publish event to RabbitMQ
  → return 202
```

**Risk:** If PostgreSQL succeeds but RabbitMQ publish fails, the invoice is persisted but the downstream services never receive the event. Acceptable during development; not acceptable in production at scale.

## When to implement

When the service moves toward production readiness or when at-least-once delivery becomes a hard requirement. The Clean Architecture port/adapter structure makes this addition contained — only the use case and a new infrastructure adapter change.

## Consequences

- Simpler use case implementation now
- Potential message loss on RabbitMQ failure (acknowledged risk)
- Adding the Outbox Pattern later requires: new `outbox_events` table + migration, new repository port, async publisher goroutine in `main.go`

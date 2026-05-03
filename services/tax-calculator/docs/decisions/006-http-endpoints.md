# 006 — HTTP Endpoints: GET /health and GET /calculations/:invoiceId

**Date:** 2026-05-02

## Decision

Expose two REST endpoints: `GET /health` and `GET /calculations/:invoiceId`. The service does not expose a synchronous calculation trigger — it is event-driven.

## Why

The tax-calculator is primarily event-driven: it consumes invoice events from RabbitMQ and persists results. However, `GET /calculations/:invoiceId` enables external observability — the API Gateway can surface tax results to clients without requiring them to understand the event flow. This makes the service demonstrable as a portfolio piece without compromising the event-driven architecture. `GET /health` is mandatory for Docker and Kubernetes health probes.

## Options Considered

| Option | Rejected because |
| --- | --- |
| **GET /health + GET /calculations/:invoiceId** ✅ | Observability without coupling; client can query results after the async calculation completes |
| No HTTP at all (pure consumer) | Not observable via API Gateway; difficult to demonstrate in a portfolio context |
| POST /calculations (synchronous trigger) | Duplicates the event-driven path; creates two entry points with potentially inconsistent behavior |
| Full CRUD | Overkill for a read-only result store; the write path belongs to the event consumer |

## Key choices

- `GET /calculations/:invoiceId` is read-only — it queries persisted results, never triggers recalculation
- Both endpoints require `X-Internal-Token` except `/health` — consistent with the auth pattern established in [ADR 004 (ingestion-service)](../../ingestion-service/docs/decisions/004-internal-auth-shared-secret.md)
- The API Gateway routes `GET /invoices/:id/taxes` to this endpoint

## Consequences

- Tax results are available via REST after the async event is processed
- No synchronous calculation path exists — clients must accept eventual consistency
- Adding more read endpoints in the future (e.g., `GET /calculations` for listing) follows the same pattern with no architectural change

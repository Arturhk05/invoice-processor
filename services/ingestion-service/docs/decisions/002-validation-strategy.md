# 002 — Validation Strategy: Trust the Gateway

**Date:** 2026-05-02

## Decision

The Ingestion Service does not re-validate invoice fields (access key format, CNPJ format, value ranges). It trusts that the API Gateway has already validated the payload before forwarding.

## Why

The API Gateway is the single entry point. It runs `class-validator` on every request before it reaches the Ingestion Service. Duplicating the same validation creates two sources of truth that can drift.

## Options Considered

| Option                                                 | Rejected because                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Trust gateway — persist and publish only** ✅        | Gateway is the boundary; Ingestion focuses on its core responsibility       |
| Re-validate everything (defense in depth)              | Two validation schemas to keep in sync; increases coupling between services |
| Validate only business rules (idempotency, duplicates) | Still requires knowing the domain shape — partial solution                  |

## Key choices

- Ingestion Service validates **existence** (required fields not nil/zero) via struct binding — not **format** (regex, length)
- Idempotency check on `access_key` is a business rule, not field validation — kept in the use case layer
- If a direct call bypasses the gateway, the database constraints (CHAR(44), NOT NULL) act as the final safety net

## Consequences

- Ingestion Service has no dependency on `validator/v10` for field-level rules
- Any change to invoice schema requires updating only the gateway DTO
- Direct calls to Ingestion bypassing the gateway may persist malformed data — acceptable since the service is internal-only

# 004 — Internal Auth: Shared Secret Header

**Date:** 2026-05-02

## Decision

Ingestion service validates `X-Internal-Token` header on every request. API Gateway injects the token. Requests without a valid token receive `401 Unauthorized`.

## Why

The ingestion service is not exposed to the internet, but it runs on a shared internal Docker network. Without auth, any compromised container on that network can call the ingestion service directly, bypassing JWT validation in the API Gateway.

A shared secret header adds lateral-movement protection at minimal cost — one middleware and one env var per service.

## Options Considered

| Option | Rejected because |
| --- | --- |
| **Shared secret header** ✅ | Low effort, sufficient for service-to-service trust within a single deployment |
| Trust by network only | Offers no protection against lateral movement from a compromised container |
| mTLS | Strong guarantee but significant operational overhead (cert management, rotation) — not justified at this stage |
| JWT service accounts | Correct at scale but adds token issuance infrastructure not yet present |

## Implementation

- Ingestion service reads `INTERNAL_TOKEN` from env on startup (required — service refuses to start if missing).
- API Gateway reads the same secret from `INGESTION_INTERNAL_TOKEN` and sets `X-Internal-Token: <value>` on every proxied request.
- Middleware returns `401` if header is absent or value does not match.
- Comparison uses `subtle.ConstantTimeCompare` to prevent timing attacks.

## Consequences

- Both services must share the same secret — managed via Docker Compose env or secrets manager in production.
- Rotating the secret requires redeploying both services simultaneously.
- If a second internal service needs to call ingestion in the future, it receives the same secret — there is no per-caller identity. Migrate to JWT service accounts or mTLS when per-caller audit becomes a requirement.

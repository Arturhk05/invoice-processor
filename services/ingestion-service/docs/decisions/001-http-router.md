# 001 — HTTP Router: net/http over Chi/Gin

**Date:** 2026-05-02

## Decision

Use Go's standard library `net/http` as the HTTP server. No external router framework.

## Why

The service exposes a single endpoint (`POST /invoices`). The complexity of Chi or Gin is not justified for one route.

## Options Considered

| Option                     | Rejected because                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| **`net/http` (stdlib)** ✅ | Zero dependencies, idiomatic Go, sufficient for one endpoint                                     |
| `Chi`                      | Lightweight but still an external dependency for routing we don't need                           |
| `Gin`                      | Feature-rich but heavy for a focused ingestion service; its patterns lean away from idiomatic Go |

## Key choices

- `http.NewServeMux()` for route registration — clear, no magic
- Custom middleware chain via handler wrapping — explicit and testable
- Graceful shutdown via `http.Server.Shutdown(ctx)` with OS signal handling

## Consequences

- No external router dependency to update or audit
- Middleware must be composed manually — acceptable given the small surface area
- If the service grows to many endpoints, migrating to Chi is straightforward (compatible interface)

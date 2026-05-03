# 002 — Dependency Injection: Manual Injection over Container Framework

**Date:** 2026-05-02

## Decision

Use manual dependency injection — constructing and wiring dependencies explicitly in `main.ts`. No DI container or decorator-based framework.

## Why

The ingestion-service (Go) follows the same pattern: all dependencies are wired in `main.go` by hand. Consistency across services reduces cognitive overhead when navigating the codebase. A DI container would add framework magic that obscures the dependency graph and makes onboarding harder.

## Options Considered

| Option | Rejected because |
| --- | --- |
| **Manual injection** ✅ | Explicit, readable, zero framework dependency, fully testable without container setup |
| `tsyringe` | Decorator-based, requires `reflect-metadata`, adds magic that hides the dependency graph |
| `inversify` | Powerful but heavyweight for a focused service; same decorator/metadata concerns as tsyringe |

## Key choices

- All wiring happens at the top of `main.ts` before the server starts
- Interfaces define contracts between layers — implementations are swapped at the wiring site for tests
- No decorators, no `reflect-metadata`, no container registration

## Consequences

- Dependency graph is fully visible by reading `main.ts`
- Unit and integration tests construct their own dependency trees — no container to configure or reset
- If the service grows significantly in complexity, migrating to a container is possible by replacing the wiring in `main.ts` without touching domain or application logic

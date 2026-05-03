# 004 — Fiscal Rules: Simplified Fixed Rates in v1

**Date:** 2026-05-02

## Decision

Use simplified fixed tax rates in v1: ICMS at 12%, PIS at 1.65%, COFINS at 7.6%. No lookup of NCM code, CFOP, CST, or tax regime.

## Why

The full Brazilian fiscal ruleset requires lookup tables for NCM (product classification), CFOP (fiscal operation code), CST (tax situation code), and company tax regime (Simples Nacional, Lucro Presumido, Lucro Real). Implementing these correctly would consume the majority of development time without adding architectural value. The fixed-rate approach validates the complete system — Clean Architecture layers, Strategy Pattern, Value Objects, event-driven flow — without getting blocked on fiscal minutiae.

## Options Considered

| Option | Rejected because |
| --- | --- |
| **Fixed rates (simplified)** ✅ | Validates full architecture; real rates are a data/rules change, not an architectural change |
| Full NCM/CFOP/CST lookup | Requires external tables, regime detection logic, and fiscal edge cases — disproportionate complexity for a portfolio v1 |
| Single aggregate rate | Loses the per-tax breakdown that makes the Strategy Pattern meaningful |

## Key choices

- Rates are defined as named constants (not magic numbers) — `ICMS_RATE = 0.12`, `PIS_RATE = 0.0165`, `COFINS_RATE = 0.076`
- Each strategy returns a `TaxLineItem` Value Object with `taxType`, `rate`, and `amount` — the shape is already compatible with a real rules engine
- Replacing fixed rates with a lookup-based implementation means rewriting strategy internals only — the interface and orchestration remain unchanged

## Consequences

- Tax calculations in v1 are fiscal approximations, not production-accurate values
- The architecture supports a real implementation as a natural evolution — no structural refactor required
- Documentation and tests make the simplification explicit, avoiding misuse in a real fiscal context

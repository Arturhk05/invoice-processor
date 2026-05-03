# 003 — v1 Tax Scope: ICMS, PIS, COFINS

**Date:** 2026-05-02

## Decision

Implement ICMS, PIS, and COFINS in v1. ISS and IPI are deferred to future versions.

## Why

ICMS, PIS, and COFINS cover the most common fiscal scenario in Brazilian NF-e (Nota Fiscal Eletrônica) for goods transactions. ISS applies exclusively to services (NFS-e), and IPI applies exclusively to industrialized goods — both represent narrower use cases that require separate document types and additional fiscal context not present in the current invoice model.

## Options Considered

| Option | Rejected because |
| --- | --- |
| **ICMS + PIS + COFINS only** ✅ | Covers the core NF-e goods case; sufficient to validate the full architecture |
| All five taxes (+ ISS + IPI) | ISS requires service-specific fields; IPI requires product classification data (NCM); both add scope without architectural benefit in v1 |
| Single flat tax | Does not demonstrate the Strategy Pattern extensibility; insufficient for a realistic portfolio scenario |

## Key choices

- Each tax implemented as a separate `TaxStrategy` — ICMS, PIS, COFINS are independent, composable units
- The `TaxCalculator` orchestrator accepts a list of strategies — adding ISS or IPI later requires only a new strategy class, no changes to orchestration logic
- Strategy Pattern makes the extension path explicit and low-risk

## Consequences

- v1 calculates three taxes out of five commonly required in Brazilian fiscal scenarios
- Adding ISS or IPI in a future version requires implementing a new `TaxStrategy` and registering it — no refactor of existing code
- The architecture is validated end-to-end with real tax identifiers and meaningful business logic

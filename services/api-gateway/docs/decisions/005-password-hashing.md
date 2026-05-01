# 005 — Password Hashing

**Date:** 2026-05-01  

## Decision

Use `bcrypt` with cost factor 12 for password hashing.

## Options Considered

| Option        | Rejected because                                                                      |
| ------------- | ------------------------------------------------------------------------------------- |
| Plaintext     | Never acceptable, even in-memory — leaks via logs/stack traces                        |
| **bcrypt** ✅ | Industry standard, well-audited, no native build issues on Alpine                     |
| argon2        | Marginally stronger but requires native bindings — complicates Docker build on Alpine |

## Cost Factor

`12` — balances security and login latency (~300ms on modern hardware). Increase to `13`+ if deployed on high-spec servers.

## Consequences

- `bcryptjs` (pure JS) used over `bcrypt` (native) — avoids `node-gyp` on Alpine
- Passwords hashed before storing in `InMemoryUserRepository`
- `AuthService.validateUser` uses `bcrypt.compare`, never plaintext comparison

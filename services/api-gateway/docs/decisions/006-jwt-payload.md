# 006 — JWT Payload Shape

**Date:** 2026-05-01  

## Decision

Minimal payload, `sub` and `email` only. No roles until proxy routes exist to protect.

## Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Why

Roles without routes to protect is premature infrastructure. Adding roles later only requires updating the JWT strategy and re-issuing tokens, no structural change.

## Consequences

- `JwtPayload` interface: `{ sub: string; email: string }`
- `@CurrentUser()` decorator extracts this from request
- Roles added when proxy module is implemented and route-level authorization requirements are known

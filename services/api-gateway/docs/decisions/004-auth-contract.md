# 004 — Auth Endpoints Contract

**Date:** 2026-05-01

## Decision

Use `email` + `password` credentials. Two endpoints: login and refresh.

## Endpoints

### POST /auth/login

```json
// request
{ "email": "user@example.com", "password": "secret" }

// response 200
{ "accessToken": "<jwt>", "refreshToken": "<jwt>" }

// response 401
{ "statusCode": 401, "message": "Invalid credentials" }
```

### POST /auth/refresh

```json
// request
{ "refreshToken": "<jwt>" }

// response 200
{ "accessToken": "<jwt>", "refreshToken": "<jwt>" }

// response 401
{ "statusCode": 401, "message": "Invalid or expired refresh token" }
```

## Options Considered

| Option                      | Rejected because                                                      |
| --------------------------- | --------------------------------------------------------------------- |
| `clientId` + `clientSecret` | OAuth2 client credentials adds ceremony without benefit at this stage |
| `username` + `password`     | Email is more standard for B2B APIs and easier to evolve to OAuth2    |
| **`email` + `password`** ✅ | Familiar, simple, evolvable                                           |

## Consequences

- `LoginDto` validates `email` (IsEmail) and `password` (IsString, MinLength)
- `RefreshDto` validates `refreshToken` (IsString, IsJWT)
- Both DTOs use `class-validator`
- Protected routes require `Authorization: Bearer <accessToken>` header

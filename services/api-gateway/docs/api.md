# API Gateway — Endpoints

> Base URL: `http://localhost:3000`

## Auth

### POST /auth/login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@invoice-processor.com",
  "password": "admin123456"
}
```

**200 OK**

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**401 Unauthorized** — invalid credentials

---

### POST /auth/refresh

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "<jwt>"
}
```

**200 OK**

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**401 Unauthorized** — invalid or expired refresh token

---

## Protected Routes

Include `Authorization: Bearer <accessToken>` header on all protected endpoints.

---

## Planned

- `POST /invoices` — submit invoice (proxied to Ingestion Service)

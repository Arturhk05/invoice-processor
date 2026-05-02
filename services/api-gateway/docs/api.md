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

## Invoices

### POST /invoices

Submit an invoice for processing. Proxied to the Ingestion Service.

```http
POST /invoices
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "accessKey":     "35240112345678000195550010000001231000001230",
  "issuerCnpj":    "12345678000195",
  "recipientCnpj": "98765432000100",
  "issuedAt":      "2024-01-15T10:30:00Z",
  "totalAmount":   1500.00
}
```

| Field           | Type   | Rules                                 |
|-----------------|--------|---------------------------------------|
| `accessKey`     | string | 44 digits, NF-e access key            |
| `issuerCnpj`    | string | 14 digits, no formatting              |
| `recipientCnpj` | string | 14 digits, no formatting              |
| `issuedAt`      | string | ISO 8601 date                         |
| `totalAmount`   | number | Positive, max 2 decimal places        |

**202 Accepted** — invoice forwarded to Ingestion Service

**400 Bad Request** — validation error

```json
{
  "statusCode": 400,
  "message": ["accessKey must match /^\\d{44}$/"],
  "timestamp": "2026-05-02T12:00:00.000Z",
  "path": "/invoices"
}
```

**401 Unauthorized** — missing or invalid token

**408 Request Timeout** — Ingestion Service did not respond within `PROXY_TIMEOUT_MS`

**409 Conflict** — invoice with this `accessKey` already exists (passed through from Ingestion Service)

```json
{
  "error": "invoice already exists",
  "id":    "550e8400-e29b-41d4-a716-446655440000"
}
```

**422 Unproessable Enctity** — Ingestion Service rejected the payload (passed through)

**429 Too Many Requests** — rate limit exceeded

---

## Health

### GET /health

```http
GET /health
```

**200 OK**

```json
{
  "status": "ok",
  "uptime": 42.3,
  "timestamp": "2026-05-02T12:00:00.000Z"
}
```

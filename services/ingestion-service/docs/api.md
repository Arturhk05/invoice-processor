# Ingestion Service — Endpoints

> Base URL: `http://localhost:8080`
>
> Internal service — not exposed to the public internet. Called by the API Gateway only.
>
> All endpoints except `/health` require the `X-Internal-Token` header.
> The value must match `INTERNAL_TOKEN` set in the service environment.

## POST /invoices

Persist an invoice and publish an event to RabbitMQ for downstream processing.

```http
POST /invoices
Content-Type: application/json
X-Internal-Token: <value of INTERNAL_TOKEN>

{
  "accessKey":     "35240112345678000195550010000001231000001230",
  "issuerCnpj":    "12345678000195",
  "recipientCnpj": "98765432000100",
  "issuedAt":      "2024-01-15T10:30:00Z",
  "totalAmount":   1500.00
}
```

### Responses

**201 Created** — invoice persisted and event published

```json
{
  "id":            "550e8400-e29b-41d4-a716-446655440000",
  "accessKey":     "35240112345678000195550010000001231000001230",
  "issuerCnpj":    "12345678000195",
  "recipientCnpj": "98765432000100",
  "issuedAt":      "2024-01-15T10:30:00Z",
  "totalAmount":   "1500.00",
  "status":        "received",
  "createdAt":     "2026-05-02T12:00:00Z"
}
```

**401 Unauthorized** — `X-Internal-Token` header missing or invalid

```json
{ "error": "unauthorized" }
```

**409 Conflict** — invoice with this `accessKey` already exists (idempotency)

```json
{
  "error": "invoice already exists",
  "id":    "550e8400-e29b-41d4-a716-446655440000"
}
```

**422 Unprocessable Entity** — domain validation failed (invalid accessKey, CNPJ, etc.)

```json
{ "error": "access key must be exactly 44 digits" }
```

**400 Bad Request** — malformed JSON body

```json
{ "error": "invalid JSON" }
```

**500 Internal Server Error** — database or broker failure

---

## GET /health

Health check for Docker and load balancer probes. No authentication required.

```http
GET /health
```

**200 OK**

```json
{ "status": "ok" }
```

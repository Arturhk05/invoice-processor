# Ingestion Service — Endpoints

> Base URL: `http://localhost:8080`
>
> Internal service — not exposed to the public internet. Called by the API Gateway only.

## POST /invoices

Persist an invoice and publish an event to RabbitMQ for downstream processing.

```http
POST /invoices
Content-Type: application/json

{
  "accessKey":     "35240112345678000195550010000001231000001230",
  "issuerCnpj":    "12345678000195",
  "recipientCnpj": "98765432000100",
  "issuedAt":      "2024-01-15T10:30:00Z",
  "totalAmount":   1500.00
}
```

### Responses

**202 Accepted** — invoice received and event published

```json
{
  "id":        "550e8400-e29b-41d4-a716-446655440000",
  "accessKey": "35240112345678000195550010000001231000001230",
  "status":    "received"
}
```

**409 Conflict** — invoice with this `accessKey` already exists (idempotency)

```json
{
  "error": "invoice already exists",
  "id":    "550e8400-e29b-41d4-a716-446655440000"
}
```

**400 Bad Request** — missing required fields

```json
{
  "error": "invalid request body"
}
```

**500 Internal Server Error** — database or broker failure

```json
{
  "error": "internal server error"
}
```

---

## GET /health

Health check for Docker and load balancer probes.

```http
GET /health
```

**200 OK**

```json
{
  "status":    "ok",
  "uptime":    42.3,
  "timestamp": "2026-05-02T12:00:00Z"
}
```

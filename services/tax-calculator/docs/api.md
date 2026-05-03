# Tax Calculator Service — Endpoints

> Base URL: `http://localhost:3001`
>
> Internal service — not exposed to the public internet. Called by the API Gateway only.
>
> All endpoints except `/health` require the `X-Internal-Token` header.
> The value must match `INTERNAL_TOKEN` set in the service environment.

## GET /health

Health check for Docker and load balancer probes. No authentication required.

```http
GET /health
```

**200 OK**

```json
{ "status": "ok" }
```

---

## GET /calculations/:invoiceId

Retrieve the tax calculation result for a given invoice. Returns the breakdown of all taxes applied to the invoice.

```http
GET /calculations/550e8400-e29b-41d4-a716-446655440000
X-Internal-Token: <value of INTERNAL_TOKEN>
```

### Responses

**200 OK** — tax calculation found

```json
{
  "id":        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "invoiceId": "550e8400-e29b-41d4-a716-446655440000",
  "totalTax":  "321.75",
  "taxes": [
    {
      "taxType": "ICMS",
      "rate":    "0.12",
      "amount":  "180.00"
    },
    {
      "taxType": "PIS",
      "rate":    "0.0165",
      "amount":  "24.75"
    },
    {
      "taxType": "COFINS",
      "rate":    "0.076",
      "amount":  "114.00"
    }
  ],
  "calculatedAt": "2026-05-02T12:01:00Z"
}
```

**401 Unauthorized** — `X-Internal-Token` header missing or invalid

```json
{ "error": "unauthorized" }
```

**404 Not Found** — no calculation exists for the given `invoiceId`

```json
{ "error": "calculation not found" }
```

**500 Internal Server Error** — database failure

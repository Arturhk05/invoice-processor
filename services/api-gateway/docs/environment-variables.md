# API Gateway — Environment Variables

Copy `.env.example` to `.env` before running.

## Reference

| Variable                 | Type                                    | Required | Default       | Description                               |
| ------------------------ | --------------------------------------- | -------- | ------------- | ----------------------------------------- |
| `NODE_ENV`               | `development` \| `production` \| `test` | No       | `development` | Runtime environment                       |
| `PORT`                   | integer (1–65535)                       | No       | `3000`        | HTTP server port                          |
| `JWT_SECRET`             | string (min 32 chars)                   | **Yes**  | —             | Secret for signing access tokens          |
| `JWT_EXPIRATION`         | string                                  | No       | `1h`          | Access token TTL — e.g. `1h`, `15m`       |
| `JWT_REFRESH_SECRET`     | string (min 32 chars)                   | **Yes**  | —             | Secret for signing refresh tokens         |
| `JWT_REFRESH_EXPIRATION` | string                                  | No       | `7d`          | Refresh token TTL — e.g. `7d`, `30d`      |
| `THROTTLE_TTL`           | integer                                 | No       | `60`          | Rate limit window in seconds (all routes) |
| `THROTTLE_LIMIT`         | integer                                 | No       | `100`         | Max requests per window per IP (default)  |
| `THROTTLE_LOGIN_LIMIT`   | integer                                 | No       | `5`           | Max login attempts per window per IP      |
| `THROTTLE_REFRESH_LIMIT`  | integer                                 | No       | `10`    | Max refresh attempts per window per IP                        |
| `INGESTION_SERVICE_URL`   | string (URI)                            | **Yes**  | —       | Base URL of the Ingestion Service                             |
| `PROXY_TIMEOUT_MS`           | integer      | No      | `5000` | Timeout in ms before returning 408 on Ingestion Service calls |
| `INGESTION_INTERNAL_TOKEN`   | string       | **Yes** | —      | Shared secret injected as `X-Internal-Token` on every proxied request (see [ingestion ADR 004](../../ingestion-service/docs/decisions/004-internal-auth-shared-secret.md)) |

## Notes

- Validation runs at boot via Joi (`src/config/env.validation.ts`) — app will not start if required vars are missing or invalid
- All errors reported at once (`abortEarly: false`)
- Access vars in code via `ConfigService`, never `process.env` directly — see [decision 001](decisions/001-config-validation.md)

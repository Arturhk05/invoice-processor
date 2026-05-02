# Ingestion Service — Environment Variables

Copy `.env.example` to `.env` before running.

## Reference

| Variable            | Type                                    | Required | Default       | Description                                 |
| ------------------- | --------------------------------------- | -------- | ------------- | ------------------------------------------- |
| `APP_ENV`           | `development` \| `production` \| `test` | No       | `development` | Runtime environment — controls log format   |
| `PORT`              | integer                                 | No       | `8080`        | HTTP server port                            |
| `DATABASE_URL`      | string                                  | **Yes**  | —             | PostgreSQL connection string                |
| `RABBITMQ_URL`      | string                                  | **Yes**  | —             | RabbitMQ connection string (AMQP)           |
| `RABBITMQ_EXCHANGE` | string                                  | No       | `invoices`    | Exchange name for publishing invoice events |
| `INTERNAL_TOKEN`    | string                                  | **Yes**  | —             | Shared secret validated on every request (see [ADR 004](decisions/004-internal-auth-shared-secret.md)) |

## Notes

- `DATABASE_URL` follows the libpq connection string format — compatible with `pgx`
- App will not start if `DATABASE_URL`, `RABBITMQ_URL`, or `INTERNAL_TOKEN` are missing
- `RABBITMQ_EXCHANGE` is declared as `topic` type — allows routing by event type in the future
- `INTERNAL_TOKEN` must match `INGESTION_INTERNAL_TOKEN` set in the API Gateway — rotate both simultaneously

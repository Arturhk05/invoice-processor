# Tax Calculator Service — Environment Variables

Copy `.env.example` to `.env` before running.

## Reference

| Variable            | Type                                    | Required | Default          | Description                                                |
| ------------------- | --------------------------------------- | -------- | ---------------- | ---------------------------------------------------------- |
| `NODE_ENV`          | `development` \| `production` \| `test` | No       | `development`    | Runtime environment — controls log format                  |
| `PORT`              | integer                                 | No       | `3001`           | HTTP server port                                           |
| `DATABASE_URL`      | string                                  | **Yes**  | —                | PostgreSQL connection string (must include `?schema=tax_calculator`) |
| `RABBITMQ_URL`      | string                                  | **Yes**  | —                | RabbitMQ connection string (AMQP)                          |
| `RABBITMQ_EXCHANGE` | string                                  | No       | `invoices`       | Exchange name for consuming invoice events                 |
| `RABBITMQ_QUEUE`    | string                                  | No       | `tax-calculator` | Queue name bound to the exchange                           |
| `INTERNAL_TOKEN`    | string                                  | **Yes**  | —                | Shared secret validated on every request (see [ADR 006](decisions/006-http-endpoints.md)) |

## Notes

- `DATABASE_URL` follows the Prisma connection URL format — append `?schema=tax_calculator` to scope all queries to the correct PostgreSQL schema (see [ADR 007](decisions/007-database-schema.md))
- App will not start if `DATABASE_URL`, `RABBITMQ_URL`, or `INTERNAL_TOKEN` are missing
- `RABBITMQ_QUEUE` is declared as a durable queue bound to `RABBITMQ_EXCHANGE` — survives broker restarts
- `INTERNAL_TOKEN` must match `TAX_CALCULATOR_INTERNAL_TOKEN` set in the API Gateway — rotate both simultaneously

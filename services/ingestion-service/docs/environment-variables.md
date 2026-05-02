# Ingestion Service — Environment Variables

Copy `.env.example` to `.env` before running.

## Reference

| Variable             | Type    | Required | Default    | Description                                   |
|----------------------|---------|----------|------------|-----------------------------------------------|
| `PORT`               | integer | No       | `8080`     | HTTP server port                              |
| `DATABASE_URL`       | string  | **Yes**  | —          | PostgreSQL connection string                  |
| `RABBITMQ_URL`       | string  | **Yes**  | —          | RabbitMQ connection string (AMQP)             |
| `RABBITMQ_EXCHANGE`  | string  | No       | `invoices` | Exchange name for publishing invoice events   |

## Notes

- `DATABASE_URL` follows the libpq connection string format — compatible with `pgx`
- App will not start if `DATABASE_URL` or `RABBITMQ_URL` are missing
- `RABBITMQ_EXCHANGE` is declared as `topic` type — allows routing by event type in the future

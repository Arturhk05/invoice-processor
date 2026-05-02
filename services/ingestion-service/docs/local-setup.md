# Ingestion Service — Local Setup

> Run from project root via Docker Compose. Do not run this service in isolation. It requires PostgreSQL and RabbitMQ.

## Prerequisites

- Go 1.25+
- Docker + Docker Compose

## Setup

```bash
cp .env.example .env
# edit .env — fill in DATABASE_URL and RABBITMQ_URL
```

**See [environment-variables.md](environment-variables.md).**

```bash
# from project root
docker compose up ingestion-service
```

App available at `http://localhost:8080`.

## Running locally (without Docker)

```bash
# start dependencies
docker compose up postgres rabbitmq -d

# run service
cd services/ingestion-service
go run ./cmd/server
```

## Commands

| Command                               | Description           |
| ------------------------------------- | --------------------- |
| `go run ./cmd/server`                 | Start the server      |
| `go build -o bin/server ./cmd/server` | Compile binary        |
| `go test ./...`                       | Run all tests         |
| `go test ./internal/...`              | Run unit tests only   |
| `go test ./test/integration/...`      | Run integration tests |
| `go vet ./...`                        | Static analysis       |

## Database migrations

Migrations run automatically on startup via `golang-migrate`.

To run manually:

```bash
migrate -path migrations -database "$DATABASE_URL" up
migrate -path migrations -database "$DATABASE_URL" down
```

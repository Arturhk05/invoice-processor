# API Gateway — Local Setup

> Run from project root via Docker Compose. Do not run this service in isolation.

## Prerequisites

- Docker + Docker Compose

## Setup

```bash
cp .env.example .env
# edit .env — fill in JWT_SECRET (min 32 chars)
```

**See [environment-variables.md](environment-variables.md).**

```bash
# from project root
docker compose up api-gateway
```

App available at `http://localhost:3000`.

## Scripts

| Command              | Description        |
| -------------------- | ------------------ |
| `npm run start:dev`  | Watch mode         |
| `npm run build`      | Compile to `dist/` |
| `npm run start:prod` | Run compiled build |
| `npm run test`       | Unit tests         |
| `npm run test:e2e`   | End-to-end tests   |
| `npm run test:cov`   | Coverage report    |
| `npm run lint`       | Lint + auto-fix    |
| `npm run format`     | Prettier format    |

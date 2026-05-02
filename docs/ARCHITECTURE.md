# Architecture Overview

The system consists of 4 independent microservices that communicate asynchronously via a message broker:

```
Client/ERP ──► API Gateway (NestJS) ──► Ingestion Service (Go) ──► RabbitMQ
                                                                      │
                                                    ┌─────────────────┴──────────────┐
                                                    ▼                                ▼
                                              Tax Calculator              Compliance Service
                                              (Node.js/TS)                    (Python)
                                                    │                            │
                                                    ▼                            ▼
                                                PostgreSQL                     Redis
                                             (fiscal data)            (cache + alerts)
```

## Main Flow

1. The **Client/ERP** sends invoice data via REST to the API Gateway.
2. The **API Gateway** authenticates the request (JWT), applies rate limiting, and routes to the Ingestion Service.
3. The **Ingestion Service** validates the invoice schema, persists to the database with the **Outbox Pattern**, and publishes the event to the queue.
4. **RabbitMQ** distributes the event to two independent consumers.
5. The **Tax Calculator** consumes the event, calculates taxes (ICMS/IPI/PIS/COFINS) based on fiscal rules, saves the result to PostgreSQL, and publishes a completion event.
6. The **Compliance Service** consumes the same event, performs anomaly analysis (atypical values, suspicious patterns, duplicates) and generates alerts when necessary.

---

# Microservices

## 1. API Gateway — NestJS / TypeScript

**Responsibility:** Single entry point for the system. Manages authentication, authorization, rate limiting, request validation, and routing to internal services.

**Why NestJS:**

- Opinionated framework with native support for modules, dependency injection, and decorators — ideal for a well-organized gateway.
- Mature ecosystem for authentication (Passport.js), validation (class-validator), documentation (Swagger), and health checks.
- TypeScript ensures type safety at the entry layer, where contract errors are most costly.
- Native support for microservices transport (RabbitMQ, Redis, gRPC) if synchronous communication is needed in the future.

**Internal Technologies:**

- **Passport.js + JWT** — stateless authentication via tokens.
- **class-validator + class-transformer** — declarative DTO validation with decorators.
- **@nestjs/swagger** — automatic OpenAPI 3.0 documentation generation.
- **@nestjs/throttler** — rate limiting by IP/user for abuse protection.
- **helmet** — HTTP security headers.
- **pino / nestjs-pino** — structured JSON logging for observability integration.

**Folder Structure:**

```
services/api-gateway/
├── src/
│   ├── modules/
│   │   ├── auth/           # JWT strategies, guards, login/refresh
│   │   └── proxy/          # Controllers routing to internal services
│   ├── common/
│   │   ├── guards/         # AuthGuard, RolesGuard
│   │   ├── interceptors/   # LoggingInterceptor, TimeoutInterceptor
│   │   ├── filters/        # HttpExceptionFilter (standardized error responses)
│   │   └── decorators/     # @CurrentUser, @Roles
│   ├── config/             # Centralized configuration (env vars, validation)
│   └── main.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
└── package.json
```

---

## 2. Ingestion Service — Go

**Responsibility:** Receive high volumes of invoice data with high performance, validate the schema, persist with guaranteed delivery (Outbox Pattern), and publish events to the queue.

**Why Go:**

- Raw performance: goroutines with low memory overhead (~2KB per goroutine vs ~1MB per thread) allow processing thousands of concurrent requests.
- Static compiled binary — final Docker image weighs ~10MB vs ~150MB+ for Node.
- Strong typing with fast compilation — ideal for a service focused on I/O and validation.
- Demonstrates versatility in the portfolio: using Go where performance matters and TypeScript where productivity matters shows technical maturity.

**Internal Technologies:**

- **net/http (stdlib)** — native HTTP server without a heavy framework. Chi or Gin as a lightweight router if needed.
- **pgx** — high-performance native PostgreSQL driver (connection pooling, prepared statements, batch operations).
- **amqp091-go** — official RabbitMQ client for Go.
- **validator/v10** — struct validation with declarative tags.
- **zap** — high-performance structured logging (zero-allocation).
- **golang-migrate** — versioned database migrations.

**Implemented Patterns:**

- **Outbox Pattern** — the invoice and the publication event are saved in the same PostgreSQL transaction. An asynchronous publisher reads the outbox table and publishes to RabbitMQ, guaranteeing atomicity between persistence and messaging.
- **Idempotency** — each invoice receives an idempotency key (invoice access key). Duplicate requests return the result of the first without reprocessing.

**Folder Structure (Clean Architecture):**

```
services/ingestion-service/
├── cmd/
│   └── server/             # Entrypoint (main.go) — bootstrap, DI, graceful shutdown
├── internal/
│   ├── domain/
│   │   ├── entity/         # Invoice, OutboxEvent — pure business rules
│   │   └── valueobject/    # AccessKey, CNPJ, TaxType — validated constructors
│   ├── application/
│   │   ├── usecase/        # IngestInvoice, PublishOutbox — orchestration
│   │   └── port/           # Interfaces (InvoiceRepository, EventPublisher)
│   ├── infrastructure/
│   │   ├── postgres/       # Repository implementation with pgx
│   │   ├── rabbitmq/       # Publisher implementation
│   │   └── http/           # HTTP handlers, middlewares, routes
│   └── config/             # Env parsing, feature flags
├── pkg/
│   ├── validator/          # Invoice validation (XML/JSON schema)
│   └── logger/             # zap wrapper with request context
├── migrations/             # Versioned SQL files
├── test/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── go.mod
└── go.sum
```

---

## 3. Tax Calculator Service — Node.js / TypeScript

**Responsibility:** Heart of business logic. Consumes invoice events from the queue, calculates taxes (ICMS, IPI, PIS, COFINS, ISS) based on Brazilian fiscal rules, persists results, and publishes completion events.

**Why Node.js/TypeScript:**

- Fiscal calculation logic is complex, with many conditional rules (NCM, CFOP, CST, tax regimes). TypeScript with interfaces and types makes this manageable and refactorable.
- Clean Architecture shines here: the fiscal domain is rich and needs complete isolation from infrastructure.
- NPM ecosystem has good libraries for financial calculations (decimal.js for arbitrary precision, avoiding floating point).
- This is the service that demonstrates **depth** in design patterns — it's where portfolio reviewers focus most attention.

**Internal Technologies:**

- **decimal.js** — arbitrary precision arithmetic for monetary calculations (never use floats for money).
- **TypeORM** — ORM with migrations and type safety. Prisma recommended for superior DX.
- **amqplib** — RabbitMQ client for consuming and publishing events.
- **ioredis** — Redis client for caching fiscal tables (NCM, rates per state) that rarely change.
- **tsyringe or inversify** — dependency injection container for inversion of control.
- **vitest** — fast test runner with native TypeScript support and mocking.

**Implemented Patterns:**

- **Complete Clean Architecture** — Domain, Application, Infrastructure, Presentation with dependency inversion via interfaces.
- **Domain Events** — each completed calculation emits a TaxCalculated event that other services can consume.
- **Strategy Pattern** — each tax type (ICMS, IPI, PIS, COFINS) is an isolated strategy, selected at runtime based on operation type.
- **Value Objects** — Money, TaxRate, CNPJ, AccessKey encapsulate validation and behavior.
- **Result Pattern** — operations return Result<T, E> instead of throwing exceptions, making errors explicit in the type system.

**Folder Structure (Clean Architecture):**

```
services/tax-calculator/
├── src/
│   ├── domain/
│   │   ├── entities/           # TaxCalculation, Invoice — aggregates with rules
│   │   ├── value-objects/      # Money, TaxRate, CNPJ, AccessKey
│   │   ├── errors/             # DomainError, InvalidTaxRate, InvoiceNotFound
│   │   └── events/             # TaxCalculated, CalculationFailed
│   ├── application/
│   │   ├── use-cases/          # CalculateTax, GetCalculationById
│   │   └── ports/
│   │       ├── inbound/        # Use case interfaces
│   │       └── outbound/       # Repository and external service interfaces
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── repositories/   # PrismaTaxCalculationRepository
│   │   │   └── migrations/
│   │   ├── messaging/          # RabbitMQConsumer, RabbitMQPublisher
│   │   └── cache/              # RedisTaxTableCache
│   └── presentation/
│       ├── consumers/          # InvoiceCreatedConsumer (queue listener)
│       └── http/               # HealthCheck, calculation queries via REST
├── test/
│   ├── unit/
│   │   ├── domain/             # Entity and value object tests
│   │   └── application/        # Use case tests with mocks
│   └── integration/            # Tests with real database and queue (testcontainers)
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 4. Compliance / Anti-Fraud Service — Python

**Responsibility:** Consume invoice and calculation completion events, execute anomaly analysis, detect suspicious patterns, and generate compliance alerts.

**Why Python:**

- Unbeatable ecosystem for data analysis: pandas, numpy, scipy, scikit-learn.
- Ease of implementing anomaly detection rules (z-score, IQR, isolation forest) without reinventing the wheel.
- FastAPI as the web framework offers native async, Pydantic validation, and automatic docs — excellent performance for a Python service.
- Demonstrates real polyglot capability: Go for performance, TypeScript for business logic, Python for analysis — each language at its strength.

**Internal Technologies:**

- **FastAPI** — async framework with Pydantic validation and automatic OpenAPI.
- **pandas** — tabular data manipulation and analysis.
- **scikit-learn** — anomaly detection algorithms (Isolation Forest, Local Outlier Factor).
- **aio-pika** — async RabbitMQ client for Python.
- **SQLAlchemy 2.0** — ORM with async support and type hints.
- **asyncpg** — high-performance async PostgreSQL driver.
- **redis-py (async)** — cache and pub/sub for real-time alerts.
- **ruff** — ultra-fast linter (written in Rust) replacing flake8, isort, and black.
- **mypy** — static type checking for Python.
- **pytest + pytest-asyncio** — testing with native async support.

**Implemented Patterns:**

- **Clean Architecture** — same layer separation as other services.
- **Observer Pattern** — when an anomaly is detected, notifies multiple handlers (save alert, publish to Redis pub/sub, log).
- **Rule Engine** — compliance rules are configurable and extensible without altering the core (each rule is a class implementing a ComplianceRule interface).

**Folder Structure:**

```
services/compliance-service/
├── src/
│   ├── domain/
│   │   ├── entities/           # Alert, ComplianceReport
│   │   └── value_objects/      # Severity, RuleType, AnomalyScore
│   ├── application/
│   │   ├── use_cases/          # AnalyzeInvoice, GetAlerts, RunComplianceCheck
│   │   └── ports/              # Interfaces (AlertRepository, AnomalyDetector)
│   ├── infrastructure/
│   │   ├── database/           # SQLAlchemy repositories
│   │   ├── messaging/          # aio-pika consumer/publisher
│   │   └── analyzers/          # IsolationForestAnalyzer, StatisticalAnalyzer
│   └── presentation/
│       ├── consumers/          # InvoiceCreatedConsumer, TaxCalculatedConsumer
│       └── api/                # FastAPI routes, main.py
├── tests/
│   ├── unit/
│   └── integration/
├── models/                     # Serialized trained models (.pkl)
├── requirements.txt
├── requirements-dev.txt
└── Dockerfile
```

---

## Infrastructure

## Message Broker — RabbitMQ

**Why RabbitMQ (not Kafka):**

- Expected volume is thousands to hundreds of thousands of invoices/day, not millions/second. RabbitMQ meets the need with headroom and is operationally simpler.
- Flexible routing with exchanges (direct, topic, fanout) — enables fan-out to Tax Calculator and Compliance without duplicating logic.
- Per-message acknowledgment — essential to ensure complete processing before removing from the queue.
- Native Dead Letter Queues — messages that failed N times go to a separate queue for analysis.
- Built-in Management UI (port 15672) — full visibility without extra tools.
- If the project scales to Kafka volumes, migration is viable because services depend on interfaces (ports), not directly on RabbitMQ.

## Database — PostgreSQL

**Why PostgreSQL:**

- Fiscal data is inherently relational (Invoice → items → taxes → participants).
- ACID compliance is mandatory for fiscal and audit data — eventual consistency is not acceptable here.
- JSONB support for storing flexible invoice payloads without losing query capability.
- Native partitioning by date — essential for tables that grow with transaction volume.
- Native full-text search — useful for searching company names and product descriptions.
- Extensions like pg_cron (scheduled jobs) and pgcrypto (encryption) are useful in the fiscal domain.

## Cache — Redis

**Why Redis:**

- Fiscal tables (ICMS rates per state, NCM → IPI) rarely change but are consulted in every calculation. Caching with 24h TTL eliminates repetitive queries.
- Native Pub/Sub for real-time compliance alerts — frontend can subscribe to alert channels.
- Idempotency keys — store idempotency keys with short TTL (e.g., 24h) for request deduplication.
- Sorted Sets for ranking anomalies by score.

## Observability — Prometheus + Grafana

**Why Prometheus + Grafana:**

- Prometheus is pull-based — each service exposes a /metrics endpoint and Prometheus collects. No agent installed on services.
- Grafana allows custom dashboards: latency by endpoint, queue throughput, error rate per service, cache hit ratio.
- Native alerting — rules like "if queue exceeds 10k messages, alert" or "if p99 latency exceeds 2s, alert".
- Industry standard stack — any portfolio reviewer recognizes and values it.
- Metrics exposed per service: request count, latency (histogram), error rate, messages processed, DLQ messages, cache hits/misses.

## Containerization — Docker + Docker Compose

**Why Docker:**

- Each service has its own Dockerfile with multi-stage builds (development, build, production).
- Production-optimized images: Go with distroless (~10MB), Node with alpine (~80MB), Python with slim (~120MB).
- `docker-compose up` brings up the entire ecosystem with one command — PostgreSQL, Redis, RabbitMQ, Prometheus, Grafana, and all 4 services.
- Health checks on all containers — compose waits for dependencies to be healthy before starting services.
- Volumes for hot-reload in development (src mounted as volume).

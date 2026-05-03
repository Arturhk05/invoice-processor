---

Plano de Implementação — Tax Calculator Service

Visão geral

Stack: Node.js 22 / TypeScript, Prisma, amqplib, decimal.js, vitest
Padrões: Clean Architecture, Strategy Pattern, Result Pattern, Value Objects
Comunicação: Consome invoice.received do RabbitMQ → publica tax.calculated / tax.calculation_failed

---

Fase 1 — Scaffold do projeto

Criar a estrutura base:

services/tax-calculator/
├── src/
│ ├── domain/
│ ├── application/
│ ├── infrastructure/
│ └── presentation/
├── test/
│ ├── unit/
│ └── integration/
├── prisma/
│ └── schema.prisma
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example

Dependências principais:

- decimal.js — aritmética de precisão arbitrária para valores monetários
- @prisma/client + prisma — ORM e migrations
- amqplib + @types/amqplib — cliente RabbitMQ
- typescript, tsx — runtime e compilação
- vitest — test runner

---

Fase 2 — Domain Layer

Value Objects:

- Money — encapsula Decimal, operações aritméticas seguras, rejeita negativos
- TaxRate — encapsula percentual (0–100), rejeita valores inválidos
- CNPJ — 14 dígitos, mesma regra do ingestion-service (portado para TS)
- AccessKey — 44 dígitos, mesma regra

Entities:

- Invoice — representa a fatura recebida do evento (reconstituída, não persistida aqui)
- TaxCalculation — agregado principal: id, invoiceId, accessKey, baseAmount, taxes[], totalTax, status, calculatedAt
- TaxLine — linha de imposto dentro de TaxCalculation: type (ICMS/PIS/COFINS), rate, base, amount

Domain Errors:

- DomainError (base)
- InvalidMoneyError, InvalidTaxRateError, CalculationAlreadyExistsError

Domain Events:

- TaxCalculated — emitido ao persistir cálculo com sucesso
- TaxCalculationFailed — emitido em caso de erro de domínio

Result Pattern:
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
Implementação própria (sem lib), ~15 linhas.

---

Fase 3 — Application Layer

Ports (outbound — interfaces):

- TaxCalculationRepository — save(calc), findByInvoiceId(id), findByAccessKey(key)
- EventPublisher — publishTaxCalculated(calc), publishTaxCalculationFailed(invoiceId, reason)
- TaxRateCache — getRates() → retorna { icms, pis, cofins }

Use Cases:

- CalculateTaxUseCase — recebe o evento invoice.received, orquestra: busca rates → aplica strategies → persiste →
  publica evento
- GetCalculationByInvoiceIdUseCase — busca cálculo pelo invoiceId (para o endpoint HTTP)

Tax Strategies (dentro de application ou domain):

- ICMSStrategy — aplica alíquota ICMS sobre totalAmount
- PISStrategy — aplica alíquota PIS
- COFINSStrategy — aplica alíquota COFINS
- Interface TaxStrategy — calculate(base: Money, rate: TaxRate): TaxLine

---

Fase 4 — Infrastructure Layer

Database (Prisma):

Schema no tax_calculator schema do PostgreSQL:

model TaxCalculation {
id String @id @default(uuid())
invoiceId String @unique
accessKey String @unique @db.Char(44)
baseAmount Decimal @db.Decimal(15, 2)
totalTax Decimal @db.Decimal(15, 2)
status String // "calculated" | "failed"
failReason String?
calculatedAt DateTime
createdAt DateTime @default(now())
taxes TaxLine[]

    @@schema("tax_calculator")

}

model TaxLine {
id String @id @default(uuid())
calculationId String
taxType String // "ICMS" | "PIS" | "COFINS"
rate Decimal @db.Decimal(5, 4)
baseAmount Decimal @db.Decimal(15, 2)
taxAmount Decimal @db.Decimal(15, 2)
calculation TaxCalculation @relation(fields: [calculationId], references: [id])

    @@schema("tax_calculator")

}

Messaging:

- RabbitMQConsumer — conecta ao exchange invoices, bind na routing key invoice.received, fila tax-calculator. Ack
  manual após processamento.
- RabbitMQPublisher — publica em exchange tax-events com routing keys tax.calculated / tax.calculation_failed

Cache:

- InMemoryTaxRateCache — implementa TaxRateCache, retorna rates fixas hardcoded (ICMS 12%, PIS 1.65%, COFINS 7.6%).
  Estruturado para substituição futura por Redis.

---

Fase 5 — Presentation Layer

Consumer:

- InvoiceReceivedConsumer — recebe mensagem do RabbitMQ, deserializa, chama CalculateTaxUseCase, faz ack/nack

HTTP:

- GET /health — liveness probe (sem dependências)
- GET /calculations/:invoiceId — chama GetCalculationByInvoiceIdUseCase, retorna 200 com resultado ou 404

Servidor HTTP com node:http nativo (mesma abordagem do ingestion-service com stdlib Go).

---

Fase 6 — Config & Bootstrap

- src/config/config.ts — carrega e valida env vars, falha fast se faltantes
- src/main.ts — wiring manual de dependências (DI manual), inicia consumer + HTTP server, graceful shutdown
  (SIGTERM/SIGINT)

---

Fase 7 — Testes

Unit (vitest):

- domain/value-objects/ — Money, TaxRate, CNPJ, AccessKey
- domain/entities/ — TaxCalculation
- application/use-cases/ — CalculateTax com mocks dos ports, GetCalculationById

Integration (vitest + testcontainers ou Docker real):

- Repository com PostgreSQL real
- Consumer/Publisher com RabbitMQ real
- Seguindo o padrão do ingestion-service (test/integration/setup_test.go → test/integration/setup.test.ts)

---

Fase 8 — Docker & docker-compose

Dockerfile: multi-stage (development → build → production), node:22-alpine, usuário não-root, health check em /health

docker-compose.yml: adicionar serviço tax-calculator com depends_on em postgres e rabbitmq (condição service_healthy)

---

Fase 9 — CI/CD

Adicionar workflows GitHub Actions seguindo o padrão dos serviços existentes:

- ci-tax-calculator.yml — lint, typecheck, unit tests, build
- cd-tax-calculator.yml — build e push da imagem Docker

---

Ordem de implementação sugerida

┌─────┬───────────────────────────────────────────┬────────────────────────────────────────────┐
│ # │ Entregável │ Por quê essa ordem │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 1 │ Scaffold + package.json + tsconfig │ Base para tudo │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 2 │ Result Pattern + Value Objects │ Sem dependências, testável imediatamente │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 3 │ Entities + Domain Errors + Tax Strategies │ Lógica pura, TDD aqui │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 4 │ Application ports + Use Cases │ Com mocks dos ports │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 5 │ Prisma schema + migration │ Infrastructure começa depois do domínio │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 6 │ PrismaTaxCalculationRepository │ Depende do schema │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 7 │ RabbitMQ Consumer + Publisher │ Depende dos use cases │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 8 │ InMemoryTaxRateCache │ Simples, desbloqueia o use case end-to-end │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 9 │ HTTP Server + endpoints │ Apresentação por último │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 10 │ Config + main.ts (wiring) │ Bootstrap depois de tudo wired │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 11 │ Testes de integração │ Depois de toda infra implementada │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 12 │ Dockerfile + docker-compose │ Por último, valida tudo junto │
├─────┼───────────────────────────────────────────┼────────────────────────────────────────────┤
│ 13 │ CI/CD workflows │ Final │
└─────┴───────────────────────────────────────────┴────────────────────────────────────────────┘

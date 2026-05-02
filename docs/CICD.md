# CI/CD

## Branch Strategy

- **`main`** — production branch. Only receives merges from `dev` via PR with approval. Direct push blocked.
- **`dev`** — development/staging branch. Receives merges from feature branches.
- **`feature/*`** — feature branches. Naming: `feature/TAX-42-calculate-icms-interstate`.
- **`fix/*`** — fix branches. Naming: `fix/TAX-58-duplicated-invoice-processing`.
- **`hotfix/*`** — urgent production fixes. Branch from `main`, merge back to `main` AND `dev`.
<!--

## Pipeline (GitHub Actions)

```
PR opened/updated
  └─► Detect Changes (which services changed)
        └─► Build + Lint + Test (only affected services)
              └─► ✅ Status check on PR

Push to dev
  └─► Detect Changes → Build + Test
        └─► Docker Build + Push (GHCR)
              └─► Deploy Staging (automatic)

Push to main
  └─► Detect Changes → Build + Test
        └─► Docker Build + Push (GHCR, tag: latest)
              └─► Deploy Production (automatic, with environment protection)
```

Docker images are published to GitHub Container Registry (GHCR) with tags: branch name, commit SHA, and `latest` for main. -->

Plano — Proxy Module

Responsabilidade: receber requests autenticadas do client e rotear p/ Ingestion Service via HTTP.

---

Estrutura a criar  
 src/modules/proxy/  
 ├── proxy.module.ts  
 ├── invoices/
 │ ├── invoices.controller.ts # POST /invoices
 │ └── dto/
 │ └── create-invoice.dto.ts # body validation

src/common/
├── interceptors/
│ └── timeout.interceptor.ts # 408 se Ingestion Service não responder
├── guards/
│ └── roles.guard.ts # depois de definir roles
└── decorators/
└── roles.decorator.ts # @Roles('admin')

---

Decisões a tomar antes de implementar

1. Como gateway fala com Ingestion Service?
   - HTTP direto (axios/HttpModule) — simples, síncrono
   - RabbitMQ — assíncrono, sem resposta imediata ao client

Ingestion Service é Go com HTTP server — faz sentido HTTP direto. 2. O gateway valida o body da invoice ou só repassa? - Validação básica (campos obrigatórios) no gateway — rejeita cedo - Passa tudo pro Ingestion Service validar — single source of truth 3. Precisa de roles agora? — POST /invoices protegido por quem?

---

Ordem de implementação

1. Decisões acima
2. Env vars: INGESTION_SERVICE_URL, PROXY_TIMEOUT_MS
3. TimeoutInterceptor
4. InvoicesController + DTO
5. ProxyModule + HttpModule
6. Wiring no AppModule
7. E2e tests
8. Swagger docs

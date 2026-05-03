# CI/CD

## Branch Strategy

- **`main`** — production branch. Only receives merges from `dev` via PR with approval. Direct push blocked.
- **`dev`** — development/staging branch. Receives merges from feature branches.
- **`feature/*`** — feature branches. Naming: `feature/TAX-42-calculate-icms-interstate`.
- **`fix/*`** — fix branches. Naming: `fix/TAX-58-duplicated-invoice-processing`.
- **`hotfix/*`** — urgent production fixes. Branch from `main`, merge back to `main` AND `dev`.

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

<!-- Docker images are published to GitHub Container Registry (GHCR) with tags: branch name, commit SHA, and `latest` for main. -->

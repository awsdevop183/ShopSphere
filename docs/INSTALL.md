# Installation

## Prerequisites
- Node.js 22+
- pnpm 10+ (`corepack enable`)
- PostgreSQL 16 (local) **or** Docker + Docker Compose

## Local development

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Database**: ensure PostgreSQL is running and a database/role exist that match
   `apps/business-api/.env` (`DATABASE_URL`). The default expects:
   - db `shopsphere`, user `shopsphere`, password `shopsphere_dev`.
   ```sql
   CREATE USER shopsphere WITH PASSWORD 'shopsphere_dev';
   CREATE DATABASE shopsphere OWNER shopsphere;
   ```
3. **Schema + seed**
   ```bash
   pnpm --filter @shopsphere/business-api db:push
   pnpm db:seed
   ```
4. **Run**
   ```bash
   pnpm dev           # API :4000 + storefront :5173
   # or individually:
   pnpm api
   pnpm web
   ```

## Reset the environment

```bash
pnpm db:seed          # re-seed synthetic data (idempotent clear + reseed)
```

## Docker Compose

```bash
docker compose up --build
```
Storefront: http://127.0.0.1:8080 · API: http://127.0.0.1:4000.

See [ENVIRONMENT.md](ENVIRONMENT.md) for all environment variables.

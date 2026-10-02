# ShopSphere

**Everything you need, delivered.**

ShopSphere is a realistic, intentionally‑vulnerable e‑commerce platform built for
hands‑on web application security training. It looks and behaves like a genuine
online store, while a separate, hardened instructor console manages a catalog of
isolated vulnerability labs — each shipping a **vulnerable** and a **secure**
reference implementation plus automated regression tests.

> ⚠️ **Training use only.** ShopSphere deliberately contains security flaws in its
> `/labs/*` routes. Run it locally, on an isolated network, for authorized
> education only. See [`docs/RESPONSIBLE_USE.md`](docs/RESPONSIBLE_USE.md).

---

## What's inside

| Experience | Where | Security posture |
|---|---|---|
| **A — Storefront** | `/`, `/products`, `/cart`, `/checkout`, `/account/*` | Hardened (trusted) |
| **B — Administration** | `/admin/*` | Hardened (trusted) — auth + authz enforced |
| **C — VulnForge Instructor Console** | `/instructor` | Hardened (trusted) — instructor role only |
| **Security Lab (student)** | `/labs/*` (API) + `/labs` (UI) | **Intentionally vulnerable** (synthetic data) |

The trusted surfaces (storefront, admin, instructor) use secure authentication
(bcrypt, server‑tracked JWT sessions), server‑side authorization, input
validation (Zod), request‑size limits, and security headers. **Only** the
`/labs/*` handlers are intentionally weak, and they operate exclusively on
synthetic/mock data.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide, Recharts
- **Backend:** Node.js, Express, TypeScript, Zod, Prisma ORM
- **Database:** PostgreSQL 16
- **Tests:** Vitest + Supertest (43 regression tests, vulnerable‑vs‑secure + platform authz)
- **Infra:** Docker Compose, nginx, isolated internal network, resource limits

## Quick start (local dev)

Prerequisites: Node 22+, pnpm 10+, PostgreSQL 16 running locally.

```bash
# 1. Install
pnpm install

# 2. Configure the database (edit apps/business-api/.env if needed)
#    Default DATABASE_URL expects a 'shopsphere' db + role.
createdb shopsphere  # or use the provided role/password

# 3. Create schema + seed synthetic data
pnpm --filter @shopsphere/business-api db:push
pnpm db:seed

# 4. Run both apps (API on :4000, storefront on :5173)
pnpm dev
```

Open http://127.0.0.1:5173.

### Demo accounts (synthetic)

| Role | Email | Password |
|---|---|---|
| Customer | `avery@example.test` | `Customer!Pass1` |
| Admin | `admin@shopsphere.test` | `Admin!Pass123` |
| Staff | `staff@shopsphere.test` | `Staff!Pass123` |
| Instructor | `instructor@shopsphere.test` | `Teach!Pass123` |

(All 30 seeded customers use `<firstname>@example.test` / `Customer!Pass1`.)

## Run with Docker Compose

```bash
docker compose up --build
# Storefront: http://127.0.0.1:8080   API: http://127.0.0.1:4000
```

Services bind to `127.0.0.1` only, run non‑root with dropped capabilities and
resource limits, and sit on an `internal: true` network with **no outbound
internet**. See [`docs/SECURITY_BOUNDARIES.md`](docs/SECURITY_BOUNDARIES.md).

## Tests

```bash
pnpm test   # Vitest + Supertest, runs against the local dev database
```

Every lab has at least two tests proving the vulnerable implementation exhibits
the flaw and the secure implementation prevents it, plus platform tests for
authentication, authorization, data isolation, and lab isolation.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Installation](docs/INSTALL.md)
- [Security boundaries](docs/SECURITY_BOUNDARIES.md)
- [Vulnerability catalog](docs/VULNERABILITY_CATALOG.md)
- [Student handbook](docs/STUDENT_HANDBOOK.md)
- [Instructor handbook](docs/INSTRUCTOR_HANDBOOK.md)
- [Lab authoring guide](docs/LAB_AUTHORING.md)
- [Database](docs/DATABASE.md) · [API](docs/API.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Responsible use](docs/RESPONSIBLE_USE.md)

## Scope & honesty note

This repository implements a **working foundation** of the full curriculum: a
complete storefront, admin portal, instructor console, and **15 fully
implemented, tested labs** (vulnerable + secure + regression tests) spanning
injection, XSS, broken access control, authentication/JWT, SSRF, path traversal,
business logic, and information disclosure. The target curriculum of 200+
scenarios in the project brief is tracked in
[`docs/VULNERABILITY_CATALOG.md`](docs/VULNERABILITY_CATALOG.md), which clearly
distinguishes **implemented** labs from **planned** ones. No vulnerability is
claimed as implemented unless it has a working demonstration and a passing test.

# Architecture

## Monorepo layout

```
shopsphere/
├── apps/
│   ├── business-api/        Express + Prisma backend (trusted platform + labs)
│   │   ├── prisma/          schema.prisma + seed.ts
│   │   ├── src/
│   │   │   ├── routes/      auth, catalog, shop, account, admin, instructor, findings
│   │   │   ├── labs/        lab framework + modules (vulnerable + secure handlers)
│   │   │   ├── auth.ts      bcrypt + server-tracked JWT sessions + role middleware
│   │   │   ├── app.ts       Express app factory (headers, CORS, routers, error handler)
│   │   │   └── server.ts    entrypoint (binds to 127.0.0.1 by default)
│   │   └── test/            Vitest + Supertest suites
│   └── storefront/          React + Vite + Tailwind SPA (storefront + admin + instructor + student tools)
├── packages/
│   ├── shared/              shared constants/types (OWASP categories, severities)
│   ├── security/            reusable SECURE helpers (escapeHtml, safeResolve, safeRedirect, pick)
│   └── ui/                  reserved for extracted design tokens
├── labs/                    lab authoring notes (implementations live in business-api/src/labs)
├── docs/                    documentation
└── docker-compose.yml       isolated, non-root, resource-limited deployment
```

## Request flow

```
Browser ──> Vite dev proxy (5173)  ──> /api/*, /labs/*  ──> business-api (4000) ──> PostgreSQL
            (prod: nginx :8080 proxies the same paths)
```

## Security boundary: trusted vs. vulnerable

The single backend hosts both the **trusted platform** and the **vulnerable
labs**, separated by route namespace and middleware:

- `/api/*` — trusted. Each router calls `requireAuth([roles])`, validates input
  with Zod, and scopes every query to the authenticated owner.
- `/labs/*` — intentionally vulnerable. Gated by the `LABS_ENABLED` master switch.
  A per-request middleware resolves the lab's `secureMode` from the database and
  sets `req.labSecure`; each handler branches between a vulnerable and a secure
  implementation. Labs operate only on **synthetic in-memory stores** and one
  **synthetic SQL table** (`lab_catalog`) — never on real customer/order tables.

The instructor console (`/api/instructor/*`) shares **no handlers** with the
vulnerable labs and is reachable only by the `INSTRUCTOR` role. Student-facing
lab discovery (`GET /labs/`) returns business context only — never root causes
or solutions.

## Lab framework

`src/labs/types.ts` defines `LabDefinition` (metadata + `mount(router)` + optional
`reset()`). `src/labs/registry.ts` lists all labs. `src/labs/index.ts` builds the
router, wiring the `LABS_ENABLED` gate and the `secureMode` resolver. Each module
in `src/labs/modules/` implements one or more labs with both code paths and
instructor-only metadata (root cause, impact, remediation, reproduction, notes).

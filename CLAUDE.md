# ShopSphere — contributor notes

Intentionally-vulnerable e-commerce training platform. See `README.md` and `docs/`.

## Golden rules
- Only `/labs/*` handlers may be insecure, and only against synthetic data
  (in-memory stores, `lab_catalog`, mock hosts, virtual FS). Never touch real
  Prisma tables from a vulnerable path.
- Trusted surfaces (`/api/auth`, `/api/account`, `/api/admin`, `/api/instructor`,
  `/api/findings`) must always enforce auth, authz, and input validation.
- Every new lab needs a vulnerable + secure handler, instructor metadata, a seed
  row, and a two-case regression test. No vuln is "done" without a passing test.

## Common commands
- `pnpm dev` — API (:4000) + storefront (:5173)
- `pnpm db:push && pnpm db:seed` — schema + synthetic data
- `pnpm test` — Vitest + Supertest (resets labs to secure mode; `DELETE FROM "LabInstance";` to restore vulnerable default)

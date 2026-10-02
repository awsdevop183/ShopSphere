# Security boundaries

ShopSphere is intentionally vulnerable **by design**, but only inside a tightly
bounded blast radius. This document states the guarantees.

## What is intentionally vulnerable
- **Only** the `/labs/*` HTTP routes, and only when `LABS_ENABLED=true` and the
  lab's `secureMode` is off (the default).
- Each lab's vulnerable behaviour is demonstrated against **synthetic data**:
  - In-memory stores (`src/labs/fixtures.ts`) for orders, profiles, coupons.
  - One synthetic SQL table `lab_catalog` for the SQL‑injection lab.
  - A **mock** HTTP host map for SSRF (no real network calls).
  - An in‑memory **virtual filesystem** for path traversal (no real files).

## What is always hardened (trusted)
- **Authentication:** bcrypt password hashing (cost 11); server‑tracked sessions
  so logout/revocation actually invalidate tokens; strong password policy; signed
  HS256 JWTs with issuer + expiry validation.
- **Authorization:** every `/api/admin/*` and `/api/instructor/*` route enforces
  role server‑side; every `/api/account/*` query is scoped to the owner.
- **Input validation:** Zod schemas on all state‑changing trusted endpoints.
- **Limits:** 256 KB JSON body limit; bounded pagination; cart quantity caps.
- **Headers:** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`
  on trusted responses; generic error handler (no stack traces) on `/api/*`.
- The **instructor console shares no handlers** with vulnerable labs and never
  exposes solutions to non‑instructors.

## Runtime / infrastructure isolation (Docker Compose)
- Binds published ports to `127.0.0.1` only (no public exposure by default).
- `lab-net` is `internal: true` → **no outbound internet** from any service.
- Containers run **non‑root** with `cap_drop: ALL` and `no-new-privileges`.
- CPU / memory / PID **resource limits** on every service.
- **No** host Docker socket mount and **no** sensitive host bind mounts.
- Disposable data: a `db:seed` / lab reset restores synthetic state.

## Explicit non‑goals (never implemented, even in labs)
- Real OS command execution, real filesystem traversal, real outbound requests,
  real payment processing, real email/webhook delivery, or access to host secrets.
- Where a realistic exploit would endanger the host, the lab uses a **safe
  simulator** that preserves the educational principle (SSRF mock network,
  virtual FS, simulated payments).

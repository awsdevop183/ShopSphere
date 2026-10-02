# Tests

Automated tests live with the backend in `apps/business-api/test/`:

- `labs.test.ts` — for every implemented lab, one test proving the **vulnerable**
  mode exhibits the flaw and one proving the **secure** mode prevents it.
- `platform.test.ts` — trusted-platform guarantees: password hashing + policy,
  session invalidation on logout, admin/instructor authorization, customer data
  isolation (ownership), per-student finding privacy, request-size limits, and
  the lab master switch.

Run them:
```bash
pnpm test
```

Frontend type safety: `pnpm --filter @shopsphere/storefront typecheck`.

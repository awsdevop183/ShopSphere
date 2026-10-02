# Labs

Lab **implementations** live in `apps/business-api/src/labs/` (framework) and
`apps/business-api/src/labs/modules/` (the vulnerable + secure handler pairs).
They are registered in `src/labs/registry.ts` and surfaced through:

- `GET /labs/` — student-safe catalog (business context only)
- `/api/instructor/labs` — full catalog with solutions (instructor role only)

To add a lab, follow [`../docs/LAB_AUTHORING.md`](../docs/LAB_AUTHORING.md).
See [`../docs/VULNERABILITY_CATALOG.md`](../docs/VULNERABILITY_CATALOG.md) for the
implemented list and the planned curriculum.

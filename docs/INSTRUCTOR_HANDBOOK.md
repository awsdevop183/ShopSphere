# Instructor handbook

Sign in with an `INSTRUCTOR` account (`instructor@shopsphere.test` /
`Teach!Pass123`) and open **VulnForge Instructor Console** at `/instructor`.

## Capabilities
- **Lab Catalog:** every lab with full solution metadata — affected endpoint,
  root cause, business impact, reproduction payload, remediation, and
  instructor-only notes. Non-instructors cannot reach this data.
- **Toggle secure/vulnerable:** flip any lab between its vulnerable and secure
  reference implementation at runtime (per-lab `secureMode`). Use this to
  demonstrate the fix live after students exploit the flaw.
- **Reset lab:** restore a lab's synthetic fixtures (orders, coupons, stored
  reviews, SQL table) without touching real accounts or student progress.
- **Student Findings:** review submitted findings across the cohort.
- **Progress:** cohort counts and category coverage.

## Suggested flow
1. Keep labs in **vulnerable** mode (default) for discovery.
2. Have students submit findings via the notebook.
3. Compare submissions to the intended vulnerability in the catalog.
4. Toggle a lab to **secure** and re-run the student's reproduction to show the
   fix holds. The same behaviour is asserted by the regression tests
   (`pnpm test`).

## Authorization model
Every instructor action requires the `INSTRUCTOR` role server-side. The console
shares no code with the vulnerable `/labs/*` handlers, so it cannot be
compromised through them.

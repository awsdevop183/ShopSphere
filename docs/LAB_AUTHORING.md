# Lab authoring guide

A lab is a `LabDefinition` (`apps/business-api/src/labs/types.ts`) that bundles
business context, a vulnerable + secure handler pair, instructor metadata, and an
optional reset.

## Steps
1. Create a module in `src/labs/modules/<group>.ts` exporting a `LabDefinition`:
   ```ts
   export const myLab: LabDefinition = {
     id: 'my-lab',
     title: 'Realistic feature name',     // student-safe, no hints
     category: 'A01:2021 Broken Access Control',
     difficulty: 'easy',
     summary: 'What the feature does (business context only).',
     affectedEndpoint: 'GET /labs/my-lab/...',
     rootCause: '…', impact: '…', remediation: '…',
     reproduction: '…', instructorNotes: '…',   // instructor-only
     reset: async () => { /* restore synthetic fixtures */ },
     mount(router) {
       router.get('/', (req, res) => {
         if (req.labSecure) { /* SECURE implementation */ return; }
         /* VULNERABLE implementation */
       });
     },
   };
   ```
2. Register it in `src/labs/registry.ts`.
3. Seed its row (`prisma/seed.ts` iterates the registry into the `Lab` table).
4. Add a regression test in `test/labs.test.ts` proving **both** modes:
   - vulnerable mode exhibits the flaw,
   - secure mode prevents it (toggle via `setLabMode(id, true)`).

## Rules
- Use **synthetic data only** — in-memory stores, `lab_catalog`, mock hosts, or
  the virtual FS. Never touch real customer/order tables.
- Never introduce real OS exec, real network egress, or host filesystem access.
  If a realistic exploit is unsafe, simulate it (see SSRF/path-traversal labs).
- Keep the student-facing `summary`/`title` free of hints or solutions.

import type { LabDefinition } from '../types.js';

// --- Lab: Verbose errors / stack trace exposure ---------------------------
export const verboseErrors: LabDefinition = {
  id: 'verbose-errors',
  title: 'Invoice parser',
  category: 'A05:2021 Security Misconfiguration (Info Disclosure)',
  difficulty: 'intro',
  summary: 'Submit invoice JSON to be parsed.',
  affectedEndpoint: 'POST /labs/verbose-errors/parse',
  rootCause: 'Unhandled errors return the full stack trace and internals to the client.',
  impact: 'Leaks file paths, library versions, and logic that aids further attacks.',
  remediation: 'Return a generic error + reference id to the client; log details server-side only.',
  reproduction: 'POST a malformed body (e.g. raw text) to trigger a parse error.',
  instructorNotes: 'Secure branch returns a generic message with an errorId; vulnerable branch returns e.stack.',
  mount(router) {
    router.post('/parse', (req, res) => {
      try {
        const amount = (req.body as any).invoice.lineItems[0].amount; // throws on bad shape
        res.json({ ok: true, firstAmount: amount });
      } catch (e: any) {
        if (req.labSecure) {
          const errorId = Math.random().toString(36).slice(2, 10);
          return res.status(400).json({ mode: 'secure', error: 'Could not parse invoice', errorId });
        }
        res.status(500).json({ mode: 'vulnerable', error: e.message, stack: e.stack });
      }
    });
  },
};

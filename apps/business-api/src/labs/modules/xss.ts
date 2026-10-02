import type { LabDefinition } from '../types.js';
import { stores, resetStores } from '../fixtures.js';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// --- Lab: Reflected XSS in search results header --------------------------
export const xssReflected: LabDefinition = {
  id: 'xss-reflected',
  title: 'Search results page',
  category: 'A03:2021 Injection (XSS)',
  difficulty: 'easy',
  summary: 'The search page echoes your query back in the results heading.',
  affectedEndpoint: 'GET /labs/xss-reflected?q=',
  rootCause: 'The query string is interpolated into the HTML response without output encoding, so markup/script executes in the victim browser.',
  impact: 'Arbitrary script execution in a victim session (defaced page, token theft in real systems). PoC renders a harmless training banner.',
  remediation: 'Context-aware output encoding (HTML-escape untrusted text); add a restrictive Content-Security-Policy.',
  reproduction: 'q=<script>document.title=1</script> or q=<img src=x onerror=alert(1)>',
  instructorNotes: 'Vulnerable branch sends raw q inside <h1>. Secure branch HTML-escapes and sets CSP.',
  mount(router) {
    router.get('/', (req, res) => {
      const q = String(req.query.q ?? '');
      res.type('html');
      if (req.labSecure) {
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'none'");
        return res.send(`<!doctype html><title>Search</title><h1>Results for "${escapeHtml(q)}"</h1><p>No products matched.</p>`);
      }
      return res.send(`<!doctype html><title>Search</title><h1>Results for "${q}"</h1><p>No products matched.</p>`);
    });
  },
};

// --- Lab: Stored XSS in product reviews -----------------------------------
interface LabReview { author: string; body: string; }
let labReviews: LabReview[] = [];
export const xssStored: LabDefinition = {
  id: 'xss-stored',
  title: 'Product reviews',
  category: 'A03:2021 Injection (XSS)',
  difficulty: 'medium',
  summary: 'Leave a review; the latest reviews render on the product page.',
  affectedEndpoint: 'POST /labs/xss-stored/reviews, GET /labs/xss-stored/page',
  rootCause: 'Stored review bodies are rendered into HTML without encoding, so injected markup persists and executes for every visitor.',
  impact: 'Persistent script execution affecting all viewers of the product page.',
  remediation: 'Encode on output; optionally sanitise allowed rich text server-side with an allowlist; add CSP.',
  reproduction: 'POST body={"author":"x","body":"<img src=x onerror=alert(1)>"} then GET /page',
  instructorNotes: 'Reviews kept in a module array. Vulnerable GET renders raw body; secure GET escapes.',
  reset: async () => { labReviews = []; },
  mount(router) {
    router.post('/reviews', (req, res) => {
      const author = escapeHtml(String(req.body?.author ?? 'anon').slice(0, 40));
      const body = String(req.body?.body ?? '').slice(0, 1000); // stored raw on purpose
      labReviews.push({ author, body });
      res.status(201).json({ ok: true, stored: labReviews.length });
    });
    router.get('/page', (req, res) => {
      res.type('html');
      const render = (r: LabReview) => req.labSecure
        ? `<li><b>${r.author}</b>: ${escapeHtml(r.body)}</li>`
        : `<li><b>${r.author}</b>: ${r.body}</li>`;
      if (req.labSecure) res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'none'");
      res.send(`<!doctype html><title>Reviews</title><ul>${labReviews.map(render).join('')}</ul>`);
    });
    router.get('/reviews', (_req, res) => res.json({ reviews: labReviews }));
  },
};

// keep fixtures reset wired for consistency
export const _resetStores = resetStores;
void stores;

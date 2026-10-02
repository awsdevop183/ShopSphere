import type { LabDefinition } from '../types.js';
import { stores } from '../fixtures.js';

// --- Lab: Open redirect ----------------------------------------------------
export const openRedirect: LabDefinition = {
  id: 'open-redirect',
  title: 'Post-login redirect',
  category: 'A01:2021 Broken Access Control (Open Redirect)',
  difficulty: 'easy',
  summary: 'After an action, the app redirects to the ?next= URL.',
  affectedEndpoint: 'GET /labs/open-redirect/go?next=',
  rootCause: 'The redirect target comes straight from user input with no validation, so it can point to an external attacker site.',
  impact: 'Phishing: a trusted ShopSphere link bounces victims to an attacker domain.',
  remediation: 'Only allow relative paths or an explicit host allowlist; reject absolute/protocol-relative URLs.',
  reproduction: 'next=https://evil.example/login',
  instructorNotes: 'Secure branch allows only paths beginning with a single "/" (not "//").',
  mount(router) {
    router.get('/go', (req, res) => {
      const next = String(req.query.next ?? '/');
      if (req.labSecure) {
        const safe = /^\/(?!\/)/.test(next) ? next : '/';
        return res.json({ mode: 'secure', redirectTo: safe, blocked: safe !== next });
      }
      res.json({ mode: 'vulnerable', redirectTo: next });
    });
  },
};

// --- Lab: SSRF via mock fetcher -------------------------------------------
export const ssrfFetch: LabDefinition = {
  id: 'ssrf-fetch',
  title: 'Product image importer',
  category: 'A10:2021 SSRF',
  difficulty: 'medium',
  summary: 'Import a product image by giving its URL. The server fetches it (mock network).',
  affectedEndpoint: 'GET /labs/ssrf-fetch/import?url=',
  rootCause: 'The server fetches an arbitrary user-supplied URL with no destination allowlist, so it can reach internal-only hosts.',
  impact: 'Reach internal services / cloud metadata (synthetic internal-metadata.lab holds the flag).',
  remediation: 'Allowlist destination hosts/schemes; resolve and block private/link-local ranges; no redirects to internal hosts.',
  reproduction: 'url=http://internal-metadata.lab/latest/meta-data/',
  instructorNotes: 'NO real network is used — only the mockHosts map. Secure branch allows only images.shopsphere.test over https.',
  mount(router) {
    router.get('/import', (req, res) => {
      const url = String(req.query.url ?? '');
      if (req.labSecure) {
        const allowed = url.startsWith('https://images.shopsphere.test/');
        if (!allowed) return res.status(400).json({ mode: 'secure', error: 'URL host not allowed' });
      }
      const target = stores.mockHosts[url];
      if (!target) return res.status(502).json({ mode: req.labSecure ? 'secure' : 'vulnerable', error: 'Fetch failed (host unreachable in mock network)' });
      res.status(target.status).json({ mode: req.labSecure ? 'secure' : 'vulnerable', fetched: url, body: target.body });
    });
  },
};

// --- Lab: Path traversal via virtual filesystem ---------------------------
export const pathTraversal: LabDefinition = {
  id: 'path-traversal',
  title: 'Document downloader',
  category: 'A01:2021 / A05:2021 (Path Traversal)',
  difficulty: 'medium',
  summary: 'Download a public document by name from the documents folder.',
  affectedEndpoint: 'GET /labs/path-traversal/download?file=',
  rootCause: 'The requested file path is joined to a base directory without normalisation, so ../ sequences escape the intended folder.',
  impact: 'Read files outside public/ (synthetic config/secrets.env holds the flag). Real impact: source/secret disclosure.',
  remediation: 'Normalise and confine to the base dir (reject ".."), or map requests to an allowlist of known files.',
  reproduction: 'file=../config/secrets.env',
  instructorNotes: 'Uses an in-memory VFS (stores.vfs), never the real filesystem. Secure branch confines to public/ and rejects traversal.',
  mount(router) {
    router.get('/download', (req, res) => {
      const file = String(req.query.file ?? '');
      if (req.labSecure) {
        // Confine: resolve against base and reject anything leaving public/.
        const normalized = ('public/' + file).replace(/\/+/g, '/');
        const parts: string[] = [];
        for (const seg of normalized.split('/')) {
          if (seg === '..') parts.pop(); else if (seg !== '.' && seg !== '') parts.push(seg);
        }
        const resolved = parts.join('/');
        if (!resolved.startsWith('public/')) return res.status(403).json({ mode: 'secure', error: 'Access denied' });
        const content = stores.vfs[resolved];
        if (content === undefined) return res.status(404).json({ mode: 'secure', error: 'Not found' });
        return res.json({ mode: 'secure', file: resolved, content });
      }
      // VULNERABLE: naive join, no normalisation.
      const key = ('public/' + file).replace(/\/+/g, '/');
      // emulate ../ resolution so traversal actually escapes
      const parts: string[] = [];
      for (const seg of key.split('/')) { if (seg === '..') parts.pop(); else if (seg !== '.' && seg !== '') parts.push(seg); }
      const resolved = parts.join('/');
      const content = stores.vfs[resolved];
      if (content === undefined) return res.status(404).json({ mode: 'vulnerable', resolved, error: 'Not found' });
      res.json({ mode: 'vulnerable', file: resolved, content });
    });
  },
};

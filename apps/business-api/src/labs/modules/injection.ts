import type { LabDefinition } from '../types.js';
import { prisma } from '../../db.js';
import { ensureLabCatalog, resetLabCatalog } from '../fixtures.js';

// --- Lab: SQL injection in product search ---------------------------------
export const sqliSearch: LabDefinition = {
  id: 'sqli-search',
  title: 'Marketplace search',
  category: 'A03:2021 Injection',
  difficulty: 'easy',
  summary: 'Search the supplier catalog by product name.',
  affectedEndpoint: 'GET /labs/sqli-search?q=',
  rootCause: 'User input is concatenated directly into a raw SQL string, so input breaks out of the string literal and alters the query (UNION/boolean/stacked payloads).',
  impact: 'Read arbitrary columns/rows from the lab schema, including internal_note holding the flag; in real systems, full data exfiltration.',
  remediation: 'Use parameterised queries ($queryRaw tagged template / Prisma query builder). Never concatenate input into SQL.',
  reproduction: "q=' UNION SELECT id, internal_note, category, price FROM lab_catalog -- ",
  instructorNotes: 'Flag lives in lab_catalog.internal_note for the Executive Chair. Secure mode uses a parameterised Prisma query that treats the payload as a literal.',
  reset: resetLabCatalog,
  mount(router) {
    router.get('/', async (req, res) => {
      await ensureLabCatalog();
      const q = String(req.query.q ?? '');
      try {
        if (req.labSecure) {
          // SECURE: parameterised — input can never alter query structure.
          const rows = await prisma.$queryRaw`
            SELECT id, name, category, price FROM lab_catalog
            WHERE name ILIKE ${'%' + q + '%'} ORDER BY id LIMIT 50`;
          return res.json({ mode: 'secure', results: rows });
        }
        // VULNERABLE: string concatenation.
        const sql = `SELECT id, name, category, price FROM lab_catalog WHERE name ILIKE '%${q}%' ORDER BY id LIMIT 50`;
        const rows = await prisma.$queryRawUnsafe(sql);
        return res.json({ mode: 'vulnerable', query: sql, results: rows });
      } catch (e: any) {
        // Verbose DB error (also an information-disclosure teaching point in vuln mode).
        return res.status(500).json({ error: req.labSecure ? 'Search failed' : String(e.message) });
      }
    });
  },
};

// --- Lab: SQL injection in authentication logic ---------------------------
export const sqliLogin: LabDefinition = {
  id: 'sqli-login',
  title: 'Partner portal sign-in',
  category: 'A03:2021 Injection',
  difficulty: 'medium',
  summary: 'Authenticate against the partner portal with email and password.',
  affectedEndpoint: 'POST /labs/sqli-login',
  rootCause: 'Credentials are concatenated into the auth SQL, so " OR 1=1 -- " makes the WHERE clause always true.',
  impact: 'Authentication bypass without valid credentials.',
  remediation: 'Parameterise the lookup, fetch by email only, then verify a password hash in application code.',
  reproduction: "email=anything' OR '1'='1 and any password",
  instructorNotes: 'Vulnerable branch builds WHERE email=... AND password=... from strings. Secure branch parameterises and compares a hash.',
  reset: resetLabCatalog,
  mount(router) {
    router.post('/', async (req, res) => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS lab_partners (
          id serial PRIMARY KEY, email text UNIQUE, password text, role text);`);
      const c = await prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT count(*)::bigint c FROM lab_partners;`);
      if (Number(c[0].c) === 0) {
        await prisma.$executeRawUnsafe(`INSERT INTO lab_partners (email,password,role) VALUES
          ('partner@example.test','correct-horse-battery','partner'),
          ('ops@example.test','s3cure-ops-pass','admin') ON CONFLICT DO NOTHING;`);
      }
      const email = String(req.body?.email ?? '');
      const password = String(req.body?.password ?? '');
      if (req.labSecure) {
        const rows = await prisma.$queryRaw<{ email: string; password: string; role: string }[]>`
          SELECT email, password, role FROM lab_partners WHERE email = ${email} LIMIT 1`;
        const user = rows[0];
        if (!user || user.password !== password) return res.status(401).json({ mode: 'secure', error: 'Invalid credentials' });
        return res.json({ mode: 'secure', authenticated: true, role: user.role });
      }
      const sql = `SELECT email, role FROM lab_partners WHERE email = '${email}' AND password = '${password}' LIMIT 1`;
      try {
        const rows = await prisma.$queryRawUnsafe<{ email: string; role: string }[]>(sql);
        if (rows.length === 0) return res.status(401).json({ mode: 'vulnerable', query: sql, error: 'Invalid credentials' });
        return res.json({ mode: 'vulnerable', query: sql, authenticated: true, as: rows[0].email, role: rows[0].role });
      } catch (e: any) {
        return res.status(500).json({ error: String(e.message), query: sql });
      }
    });
  },
};

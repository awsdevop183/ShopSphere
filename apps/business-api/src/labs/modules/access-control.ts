import type { LabDefinition } from '../types.js';
import { stores } from '../fixtures.js';

// Labs identify the "current user" via a synthetic X-Lab-User header
// (e.g. avery@example.test). This keeps scenarios self-contained and keeps
// lab identities fully separate from the trusted platform's real sessions.
function labUser(req: any): string {
  return String(req.headers['x-lab-user'] ?? 'avery@example.test');
}

// --- Lab: IDOR in customer order details ----------------------------------
export const idorOrders: LabDefinition = {
  id: 'idor-orders',
  title: 'Order details',
  category: 'A01:2021 Broken Access Control',
  difficulty: 'easy',
  summary: 'View an order by its id. You are signed in via the X-Lab-User header.',
  affectedEndpoint: 'GET /labs/idor-orders/orders/:id',
  rootCause: 'The handler looks up an order by id with no ownership check, so any authenticated user can read any order (insecure direct object reference).',
  impact: 'Read other customers’ orders, totals, and items by iterating ids.',
  remediation: 'Scope the query to the owner (WHERE id = ? AND owner = currentUser) and 404 on mismatch.',
  reproduction: 'As avery@example.test, GET /orders/1003 (owned by blair) or /orders/1004 (casey).',
  instructorNotes: 'Sequential ids 1001-1004. Avery owns 1001/1002. Secure mode returns 404 for others.',
  mount(router) {
    router.get('/orders/:id', (req, res) => {
      const id = Number(req.params.id);
      const order = stores.orders.find((o) => o.id === id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (req.labSecure && order.owner !== labUser(req)) {
        return res.status(404).json({ mode: 'secure', error: 'Order not found' });
      }
      res.json({ mode: req.labSecure ? 'secure' : 'vulnerable', order });
    });
    router.get('/orders', (req, res) => {
      const mine = stores.orders.filter((o) => o.owner === labUser(req));
      res.json({ orders: mine.map((o) => ({ id: o.id, number: o.number })) });
    });
  },
};

// --- Lab: Broken Object Level Authorization on profile API ----------------
export const bolaProfiles: LabDefinition = {
  id: 'bola-profiles',
  title: 'Customer profile API',
  category: 'API1:2023 Broken Object Level Authorization',
  difficulty: 'easy',
  summary: 'Fetch a customer profile record by numeric id.',
  affectedEndpoint: 'GET /labs/bola-profiles/profiles/:id',
  rootCause: 'Object-level authorization is missing: the id is trusted and returns any record, exposing PII (synthetic SSN last-4, phone).',
  impact: 'Harvest other customers’ personal data by enumerating ids.',
  remediation: 'Enforce per-object ownership; return only records the caller owns (or has an explicit grant for).',
  reproduction: 'As avery (id 1), GET /profiles/2 and /profiles/3.',
  instructorNotes: 'Also demonstrates excessive data exposure: vulnerable mode returns ssnLast4.',
  mount(router) {
    router.get('/profiles/:id', (req, res) => {
      const id = Number(req.params.id);
      const profile = stores.profiles.find((p) => p.id === id);
      if (!profile) return res.status(404).json({ error: 'Not found' });
      if (req.labSecure && profile.owner !== labUser(req)) {
        return res.status(403).json({ mode: 'secure', error: 'Forbidden' });
      }
      if (req.labSecure) {
        const { ssnLast4, ...safe } = profile; // field-level authz: strip sensitive field
        return res.json({ mode: 'secure', profile: safe });
      }
      res.json({ mode: 'vulnerable', profile });
    });
  },
};

// --- Lab: Mass assignment / privilege escalation on registration ----------
export const massAssignment: LabDefinition = {
  id: 'mass-assignment',
  title: 'Account sign-up',
  category: 'A08:2021 / API6:2023 Mass Assignment',
  difficulty: 'medium',
  summary: 'Create a loyalty account by posting your details.',
  affectedEndpoint: 'POST /labs/mass-assignment/signup',
  rootCause: 'The handler spreads the entire request body into the new record, so a client can set privileged fields like role or storeCredit.',
  impact: 'Self-assign admin role or arbitrary store credit at sign-up.',
  remediation: 'Bind only an explicit allowlist of fields; never persist the raw request body.',
  reproduction: 'POST {"email":"x@test","role":"admin","storeCredit":9999}',
  instructorNotes: 'Secure branch picks only {email, firstName, lastName}; role defaults to customer, credit to 0.',
  mount(router) {
    router.post('/signup', (req, res) => {
      const body = req.body ?? {};
      if (req.labSecure) {
        const account = { email: String(body.email ?? ''), firstName: String(body.firstName ?? ''), role: 'customer', storeCredit: 0 };
        return res.status(201).json({ mode: 'secure', account });
      }
      const account = { role: 'customer', storeCredit: 0, ...body }; // body overrides defaults
      res.status(201).json({ mode: 'vulnerable', account });
    });
  },
};

// --- Lab: Missing function-level authorization (admin action) -------------
export const functionLevel: LabDefinition = {
  id: 'func-level-authz',
  title: 'Promote staff endpoint',
  category: 'A01:2021 / API5:2023 Broken Function Level Authorization',
  difficulty: 'medium',
  summary: 'An internal endpoint promotes a user to staff. Role passed via X-Lab-Role.',
  affectedEndpoint: 'POST /labs/func-level-authz/promote',
  rootCause: 'The admin-only function performs no role check, so any caller can invoke it (forced browsing to privileged functionality).',
  impact: 'Privilege escalation by any authenticated user.',
  remediation: 'Enforce a server-side role check on every privileged function, not just in the UI.',
  reproduction: 'POST with X-Lab-Role: customer and body {"target":"avery@example.test"}.',
  instructorNotes: 'Secure branch requires X-Lab-Role: admin.',
  mount(router) {
    router.post('/promote', (req, res) => {
      const role = String(req.headers['x-lab-role'] ?? 'customer');
      if (req.labSecure && role !== 'admin') return res.status(403).json({ mode: 'secure', error: 'Admin role required' });
      res.json({ mode: req.labSecure ? 'secure' : 'vulnerable', promoted: String(req.body?.target ?? ''), by: role });
    });
  },
};

import type { LabDefinition } from '../types.js';
import jwt from 'jsonwebtoken';

// Synthetic, lab-only signing key. NOT the trusted platform secret.
const LAB_WEAK_SECRET = 'secret';
const LAB_STRONG_SECRET = 'lab-strong-9f3a1c7e5b2d4680a1c3e5f7091b2d4c6e8a0c2e';

// --- Lab: JWT weaknesses (alg confusion / weak key / missing claims) -------
export const jwtWeak: LabDefinition = {
  id: 'jwt-weak',
  title: 'API token verification',
  category: 'A07:2021 / API2:2023 Identification & Auth Failures',
  difficulty: 'hard',
  summary: 'Call the protected API with a Bearer JWT. GET /token issues a sample customer token.',
  affectedEndpoint: 'GET /labs/jwt-weak/whoami (Bearer), GET /labs/jwt-weak/token',
  rootCause: 'The verifier uses a trivially-guessable HMAC secret ("secret") and ignores expiry/claims, so anyone who guesses the key can forge tokens. (alg=none is a related concept; jsonwebtoken blocks it when a key is set.)',
  impact: 'Forge a token with role=admin and impersonate any user.',
  remediation: 'Pin algorithms (e.g. HS256 only), use a long random secret, and validate issuer, audience and expiry.',
  reproduction: 'Sign a JWT with HMAC key "secret": {"sub":"x","role":"admin","iss":"shopsphere-lab"}.',
  instructorNotes: 'Vulnerable verify uses weak key "secret" and skips the issuer check. Secure uses a long random key, HS256 only, and enforces issuer+expiry. The guessable key is the tested forgery path.',
  mount(router) {
    router.get('/token', (req, res) => {
      const secret = req.labSecure ? LAB_STRONG_SECRET : LAB_WEAK_SECRET;
      const token = jwt.sign({ sub: 'customer-7', role: 'customer' }, secret, { algorithm: 'HS256', issuer: 'shopsphere-lab', expiresIn: '15m' });
      res.json({ token });
    });
    router.get('/whoami', (req, res) => {
      const auth = String(req.headers.authorization ?? '');
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (!token) return res.status(401).json({ error: 'Missing token' });
      try {
        if (req.labSecure) {
          const payload = jwt.verify(token, LAB_STRONG_SECRET, { algorithms: ['HS256'], issuer: 'shopsphere-lab' }) as any;
          return res.json({ mode: 'secure', sub: payload.sub, role: payload.role });
        }
        // VULNERABLE: allows 'none', weak key, no issuer/expiry enforcement.
        const payload = jwt.verify(token, LAB_WEAK_SECRET, { algorithms: ['HS256'] }) as any; // weak key, no issuer/expiry hardening
        return res.json({ mode: 'vulnerable', sub: payload.sub, role: payload.role });
      } catch (e: any) {
        return res.status(401).json({ error: 'Invalid token', detail: req.labSecure ? undefined : String(e.message) });
      }
    });
  },
};

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { hashPassword, verifyPassword, issueSession, revokeSession, requireAuth } from '../auth.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { fail } from '../util.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  // Trusted platform enforces a real password policy.
  password: z.string().min(10, 'Password must be at least 10 characters')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[0-9]/, 'Needs a digit'),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid registration', { issues: parsed.error.flatten() });
  const { email, password, firstName, lastName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return fail(res, 409, 'An account with that email already exists');
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      profile: { create: {} },
      cart: { create: {} },
    },
  });
  const token = await issueSession(user.id, req.headers['user-agent']);
  res.cookie?.('ss_session', token, { httpOnly: true, sameSite: 'lax', secure: config.isProd });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, firstName, lastName } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid credentials');
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  // Constant-ish response: same error whether user missing or password wrong.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail(res, 401, 'Invalid email or password');
  }
  const token = await issueSession(user.id, req.headers['user-agent']);
  res.cookie?.('ss_session', token, { httpOnly: true, sameSite: 'lax', secure: config.isProd });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
});

authRouter.post('/logout', requireAuth(), async (req, res) => {
  const header = req.headers.authorization?.slice(7) ?? (req as any).cookies?.ss_session;
  if (header) {
    try {
      const payload = jwt.verify(header, config.jwtSecret) as jwt.JwtPayload;
      if (payload.sid) await revokeSession(payload.sid as string);
    } catch { /* ignore */ }
  }
  res.clearCookie?.('ss_session');
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth(), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, role: true, firstName: true, lastName: true, emailVerified: true },
  });
  res.json({ user });
});

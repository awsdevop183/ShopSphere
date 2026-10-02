import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db.js';
import { config } from './config.js';
import { fail } from './util.js';
import type { Role } from '@prisma/client';

const COST = 11;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

// Issue a server-tracked session plus a signed JWT referencing it.
export async function issueSession(userId: string, userAgent?: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const session = await prisma.session.create({
    data: {
      token: crypto.randomUUID(),
      userId,
      expiresAt,
      userAgent: userAgent?.slice(0, 200),
    },
  });
  return jwt.sign({ sid: session.id, uid: userId }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '7d',
    issuer: 'shopsphere-platform',
  });
}

export async function revokeSession(sid: string): Promise<void> {
  await prisma.session.updateMany({ where: { id: sid }, data: { revokedAt: new Date() } });
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.ss_session;
  return cookie ?? null;
}

// Trusted-platform authentication. Validates signature, issuer, expiry AND the
// server-side session record (so logout/revocation actually works).
export async function authenticate(req: Request): Promise<AuthUser | null> {
  const token = readToken(req);
  if (!token) return null;
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'shopsphere-platform',
    }) as jwt.JwtPayload;
  } catch {
    return null;
  }
  const sid = payload.sid as string | undefined;
  if (!sid) return null;
  const session = await prisma.session.findUnique({ where: { id: sid }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  return { id: session.user.id, email: session.user.email, role: session.user.role };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(roles?: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await authenticate(req);
    if (!user) return fail(res, 401, 'Authentication required');
    if (roles && !roles.includes(user.role)) return fail(res, 403, 'Insufficient permissions');
    req.user = user;
    next();
  };
}

// Optional auth: attaches req.user when present, never rejects.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = (await authenticate(req)) ?? undefined;
  next();
}

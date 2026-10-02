import { Router } from 'express';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { labRegistry } from './registry.js';

// Mounts every lab under /labs/:labId/*. A per-request middleware resolves the
// current secureMode so handlers can branch. The whole tree is gated by the
// LABS_ENABLED master switch (off => 503 everywhere).
export function buildLabsRouter(): Router {
  const root = Router();

  root.use((_req, res, next) => {
    if (!config.labsEnabled) return res.status(503).json({ error: 'Lab environment is disabled' });
    next();
  });

  // Student-safe lab catalog (NO solutions, root cause, or remediation).
  root.get('/', (_req, res) => {
    res.json({
      labs: labRegistry.map((l) => ({
        id: l.id, title: l.title, category: l.category,
        difficulty: l.difficulty, summary: l.summary, affectedEndpoint: l.affectedEndpoint,
      })),
    });
  });

  for (const lab of labRegistry) {
    const sub = Router({ mergeParams: true });
    sub.use(async (req, _res, next) => {
      req.labId = lab.id;
      const instance = await prisma.labInstance.findFirst({ where: { labId: lab.id } });
      req.labSecure = instance?.secureMode ?? false;
      next();
    });
    lab.mount(sub);
    root.use(`/${lab.id}`, sub);
  }

  return root;
}

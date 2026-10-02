import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';
import { labRegistry } from '../labs/registry.js';
import { fail } from '../util.js';

export const instructorRouter = Router();
// Instructor console: every action requires INSTRUCTOR role, server-side.
// This router shares NO handlers with the vulnerable lab routes.
instructorRouter.use(requireAuth(['INSTRUCTOR']));

// Full catalog WITH solutions/root-cause — instructor only.
instructorRouter.get('/labs', async (_req, res) => {
  const instances = await prisma.labInstance.findMany();
  const byLab = new Map(instances.map((i) => [i.labId, i]));
  res.json({
    labs: labRegistry.map((l) => ({
      id: l.id, title: l.title, category: l.category, difficulty: l.difficulty,
      summary: l.summary, affectedEndpoint: l.affectedEndpoint,
      rootCause: l.rootCause, impact: l.impact, remediation: l.remediation,
      instructorNotes: l.instructorNotes, reproduction: l.reproduction,
      secureMode: byLab.get(l.id)?.secureMode ?? false,
    })),
  });
});

instructorRouter.get('/labs/:id', async (req, res) => {
  const lab = labRegistry.find((l) => l.id === req.params.id);
  if (!lab) return fail(res, 404, 'Lab not found');
  const instance = await prisma.labInstance.findFirst({ where: { labId: lab.id } });
  res.json({ lab: { ...lab, secureMode: instance?.secureMode ?? false } });
});

// Toggle a lab between vulnerable and secure reference implementations.
instructorRouter.post('/labs/:id/mode', async (req, res) => {
  const lab = labRegistry.find((l) => l.id === req.params.id);
  if (!lab) return fail(res, 404, 'Lab not found');
  const secureMode = Boolean(req.body?.secure);
  await prisma.labInstance.upsert({
    where: { id: `${lab.id}-default` },
    create: { id: `${lab.id}-default`, labId: lab.id, secureMode },
    update: { secureMode },
  });
  await prisma.auditEvent.create({ data: { actor: req.user!.email, action: 'lab.mode', target: lab.id, meta: JSON.stringify({ secureMode }) } });
  res.json({ ok: true, secureMode });
});

// Reset a lab's synthetic state (re-seed just this lab's fixtures).
instructorRouter.post('/labs/:id/reset', async (req, res) => {
  const lab = labRegistry.find((l) => l.id === req.params.id);
  if (!lab) return fail(res, 404, 'Lab not found');
  if (lab.reset) await lab.reset();
  await prisma.labInstance.upsert({
    where: { id: `${lab.id}-default` },
    create: { id: `${lab.id}-default`, labId: lab.id, resetAt: new Date() },
    update: { resetAt: new Date() },
  });
  await prisma.auditEvent.create({ data: { actor: req.user!.email, action: 'lab.reset', target: lab.id } });
  res.json({ ok: true });
});

// Review student findings across the cohort.
instructorRouter.get('/findings', async (_req, res) => {
  const findings = await prisma.studentFinding.findMany({
    where: { status: { in: ['submitted', 'reviewed'] } },
    orderBy: { updatedAt: 'desc' }, include: { user: { select: { email: true } }, lab: true },
  });
  res.json({ findings });
});

instructorRouter.get('/progress', async (_req, res) => {
  const [students, submitted, byCategory] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.studentFinding.count({ where: { status: 'submitted' } }),
    prisma.studentFinding.groupBy({ by: ['category'], _count: true }),
  ]);
  res.json({ students, submitted, byCategory });
});

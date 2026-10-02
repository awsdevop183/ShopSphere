import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';
import { fail } from '../util.js';

export const findingsRouter = Router();
findingsRouter.use(requireAuth());

const schema = z.object({
  title: z.string().min(1).max(160), endpoint: z.string().min(1).max(300),
  category: z.string().min(1).max(60), severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
  steps: z.string().min(1).max(8000), impact: z.string().min(1).max(4000),
  remediation: z.string().min(1).max(4000), labId: z.string().optional(),
  status: z.enum(['draft', 'submitted']).default('draft'),
});

findingsRouter.get('/', async (req, res) => {
  const findings = await prisma.studentFinding.findMany({ where: { userId: req.user!.id }, orderBy: { updatedAt: 'desc' } });
  res.json({ findings });
});

findingsRouter.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid finding', { issues: parsed.error.flatten() });
  const f = await prisma.studentFinding.create({ data: { ...parsed.data, userId: req.user!.id } });
  res.status(201).json({ finding: f });
});

findingsRouter.patch('/:id', async (req, res) => {
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid finding');
  // Ownership enforced: a student may only edit their own findings.
  const existing = await prisma.studentFinding.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) return fail(res, 404, 'Finding not found');
  const f = await prisma.studentFinding.update({ where: { id: existing.id }, data: parsed.data });
  res.json({ finding: f });
});

findingsRouter.delete('/:id', async (req, res) => {
  await prisma.studentFinding.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';
import { fail, num } from '../util.js';

export const adminRouter = Router();
// Trusted admin portal ALWAYS enforces authz. These are not vulnerable handlers.
adminRouter.use(requireAuth(['ADMIN', 'STAFF']));

adminRouter.get('/dashboard', async (_req, res) => {
  const [orders, revenue, customers, lowStock] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.inventory.count({ where: { stock: { lt: 10 } } }),
  ]);
  const recent = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: true } });
  res.json({
    stats: { orders, revenue: num(revenue._sum.total), customers, lowStock },
    recentOrders: recent.map((o) => ({ number: o.number, customer: o.user.email, total: num(o.total), status: o.status })),
  });
});

adminRouter.get('/products', async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }, include: { category: true, inventory: true }, take: 100,
  });
  res.json({ products: products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, price: num(p.price), stock: p.inventory?.stock ?? 0, category: p.category.name })) });
});

const productSchema = z.object({
  name: z.string().min(1).max(160), slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1), price: z.number().positive(), categoryId: z.string().min(1),
  stock: z.number().int().min(0).default(0),
});
adminRouter.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid product', { issues: parsed.error.flatten() });
  const d = parsed.data;
  const product = await prisma.product.create({
    data: { name: d.name, slug: d.slug, description: d.description, price: d.price, categoryId: d.categoryId, inventory: { create: { stock: d.stock } } },
  });
  res.status(201).json({ id: product.id });
});

adminRouter.get('/orders', async (_req, res) => {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: true } });
  res.json({ orders: orders.map((o) => ({ id: o.id, number: o.number, customer: o.user.email, total: num(o.total), status: o.status, createdAt: o.createdAt })) });
});

adminRouter.patch('/orders/:id', requireAuth(['ADMIN', 'STAFF']), async (req, res) => {
  const status = String(req.body?.status);
  const valid = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  if (!valid.includes(status)) return fail(res, 400, 'Invalid status');
  await prisma.order.update({ where: { id: req.params.id }, data: { status: status as any } });
  res.json({ ok: true });
});

adminRouter.get('/customers', async (_req, res) => {
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 100, select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, _count: { select: { orders: true } } } });
  res.json({ customers: customers.map((c) => ({ ...c, orders: c._count.orders })) });
});

adminRouter.get('/coupons', async (_req, res) => {
  res.json({ coupons: await prisma.coupon.findMany() });
});
adminRouter.post('/coupons', requireAuth(['ADMIN']), async (req, res) => {
  const schema = z.object({ code: z.string().min(3).max(40), description: z.string().max(200), percentOff: z.number().int().min(0).max(100).default(0), amountOff: z.number().min(0).default(0), maxRedemptions: z.number().int().min(0).default(0) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid coupon');
  const c = await prisma.coupon.create({ data: { ...parsed.data, code: parsed.data.code.toUpperCase() } });
  res.status(201).json({ id: c.id });
});

adminRouter.get('/reviews', async (_req, res) => {
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { product: true, user: true } });
  res.json({ reviews: reviews.map((r) => ({ id: r.id, product: r.product.name, author: r.user.email, rating: r.rating, title: r.title, approved: r.approved })) });
});
adminRouter.patch('/reviews/:id', async (req, res) => {
  await prisma.review.update({ where: { id: req.params.id }, data: { approved: Boolean(req.body?.approved) } });
  res.json({ ok: true });
});

adminRouter.get('/audit-log', requireAuth(['ADMIN']), async (_req, res) => {
  res.json({ events: await prisma.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }) });
});

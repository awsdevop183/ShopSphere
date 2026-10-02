import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';
import { fail, num } from '../util.js';

export const accountRouter = Router();
accountRouter.use(requireAuth());

accountRouter.get('/profile', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, firstName: true, lastName: true, profile: true },
  });
  res.json({ profile: user });
});

const profileSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  phone: z.string().max(30).optional(),
});
accountRouter.patch('/profile', async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid profile');
  const { firstName, lastName, phone } = parsed.data;
  await prisma.user.update({ where: { id: req.user!.id }, data: { firstName, lastName } });
  if (phone !== undefined) {
    await prisma.customerProfile.upsert({
      where: { userId: req.user!.id }, create: { userId: req.user!.id, phone }, update: { phone },
    });
  }
  res.json({ ok: true });
});

// Orders — scoped to the authenticated user (ownership enforced).
accountRouter.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
  res.json({
    orders: orders.map((o) => ({
      id: o.id, number: o.number, status: o.status, total: num(o.total),
      createdAt: o.createdAt, itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    })),
  });
});

accountRouter.get('/orders/:id', async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id }, // ownership check
    include: { items: true, payment: true },
  });
  if (!order) return fail(res, 404, 'Order not found');
  res.json({
    order: {
      id: order.id, number: order.number, status: order.status,
      subtotal: num(order.subtotal), discount: num(order.discount), shipping: num(order.shipping),
      total: num(order.total), shipTo: order.shipTo, createdAt: order.createdAt,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: num(i.unitPrice) })),
      payment: order.payment ? { method: order.payment.method, last4: order.payment.last4 } : null,
    },
  });
});

accountRouter.post('/orders/:id/cancel', async (req, res) => {
  const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!order) return fail(res, 404, 'Order not found');
  if (!['PENDING', 'PAID'].includes(order.status)) return fail(res, 409, 'Order can no longer be cancelled');
  await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
  res.json({ ok: true });
});

// Addresses
accountRouter.get('/addresses', async (req, res) => {
  res.json({ addresses: await prisma.address.findMany({ where: { userId: req.user!.id } }) });
});
const addrSchema = z.object({
  label: z.string().min(1).max(40), line1: z.string().min(1).max(120), line2: z.string().max(120).optional(),
  city: z.string().min(1).max(80), region: z.string().min(1).max(80), postal: z.string().min(1).max(20), country: z.string().min(2).max(3),
});
accountRouter.post('/addresses', async (req, res) => {
  const parsed = addrSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid address');
  const addr = await prisma.address.create({ data: { ...parsed.data, userId: req.user!.id } });
  res.status(201).json({ address: addr });
});
accountRouter.delete('/addresses/:id', async (req, res) => {
  await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});

// Wishlist
accountRouter.get('/wishlist', async (req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
  });
  res.json({ wishlist: items });
});
accountRouter.post('/wishlist/:productId', async (req, res) => {
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user!.id, productId: req.params.productId } },
    create: { userId: req.user!.id, productId: req.params.productId }, update: {},
  });
  res.status(201).json({ ok: true });
});
accountRouter.delete('/wishlist/:productId', async (req, res) => {
  await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.id, productId: req.params.productId } });
  res.json({ ok: true });
});

// Reviews (create) — must have purchased is NOT required here, but is sanitised on output elsewhere.
const reviewSchema = z.object({
  productId: z.string().min(1), rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(120), body: z.string().min(1).max(2000),
});
accountRouter.post('/reviews', async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid review');
  const review = await prisma.review.create({ data: { ...parsed.data, userId: req.user!.id } });
  // Recompute product rating.
  const agg = await prisma.review.aggregate({ where: { productId: parsed.data.productId, approved: true }, _avg: { rating: true } });
  await prisma.product.update({ where: { id: parsed.data.productId }, data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10 } });
  res.status(201).json({ review: { id: review.id } });
});

// Support tickets
accountRouter.get('/support', async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } });
  res.json({ tickets });
});
accountRouter.post('/support', async (req, res) => {
  const subject = String(req.body?.subject ?? '').slice(0, 160);
  const body = String(req.body?.body ?? '').slice(0, 4000);
  if (!subject || !body) return fail(res, 400, 'Subject and message required');
  const ticket = await prisma.supportTicket.create({
    data: { userId: req.user!.id, subject, messages: { create: { author: 'customer', body } } },
  });
  res.status(201).json({ ticketId: ticket.id });
});
accountRouter.get('/support/:id', async (req, res) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.id }, include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket) return fail(res, 404, 'Ticket not found');
  res.json({ ticket });
});

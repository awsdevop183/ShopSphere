import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../auth.js';
import { fail, num, orderNumber } from '../util.js';

export const shopRouter = Router();
shopRouter.use(requireAuth());

async function cartFor(userId: string) {
  return prisma.cart.upsert({
    where: { userId }, create: { userId }, update: {},
    include: { items: { include: { product: { include: { images: true, inventory: true } } } } },
  });
}

function cartView(cart: Awaited<ReturnType<typeof cartFor>>) {
  const items = cart.items.map((i) => ({
    productId: i.productId, slug: i.product.slug, name: i.product.name,
    unitPrice: num(i.product.price), quantity: i.quantity,
    image: i.product.images[0]?.url ?? null,
    lineTotal: num(i.product.price) * i.quantity,
  }));
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return { items, subtotal, count: items.reduce((s, i) => s + i.quantity, 0) };
}

shopRouter.get('/cart', async (req, res) => res.json(cartView(await cartFor(req.user!.id))));

const addSchema = z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(20) });
shopRouter.post('/cart/items', async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid cart item');
  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId }, include: { inventory: true } });
  if (!product) return fail(res, 404, 'Product not found');
  const cart = await cartFor(req.user!.id);
  const existing = cart.items.find((i) => i.productId === product.id);
  const newQty = Math.min(20, (existing?.quantity ?? 0) + parsed.data.quantity);
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    create: { cartId: cart.id, productId: product.id, quantity: parsed.data.quantity },
    update: { quantity: newQty },
  });
  res.status(201).json(cartView(await cartFor(req.user!.id)));
});

shopRouter.patch('/cart/items/:productId', async (req, res) => {
  const qty = Number(req.body?.quantity);
  if (!Number.isInteger(qty) || qty < 0 || qty > 20) return fail(res, 400, 'Invalid quantity');
  const cart = await cartFor(req.user!.id);
  if (qty === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: req.params.productId } });
  } else {
    await prisma.cartItem.updateMany({ where: { cartId: cart.id, productId: req.params.productId }, data: { quantity: qty } });
  }
  res.json(cartView(await cartFor(req.user!.id)));
});

shopRouter.delete('/cart/items/:productId', async (req, res) => {
  const cart = await cartFor(req.user!.id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: req.params.productId } });
  res.json(cartView(await cartFor(req.user!.id)));
});

// Checkout. Validates quantities, applies a coupon safely, simulates payment.
const checkoutSchema = z.object({
  shipTo: z.string().min(5).max(300),
  couponCode: z.string().max(40).optional(),
  payment: z.object({ method: z.string().max(20), last4: z.string().regex(/^[0-9]{4}$/) }),
});
shopRouter.post('/checkout', async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid checkout', { issues: parsed.error.flatten() });
  const cart = await cartFor(req.user!.id);
  if (cart.items.length === 0) return fail(res, 400, 'Cart is empty');

  const view = cartView(cart);
  let discount = 0;
  let couponCode: string | null = null;
  if (parsed.data.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: parsed.data.couponCode.toUpperCase() } });
    const usable = coupon && coupon.state === 'ACTIVE' &&
      (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
      (coupon.maxRedemptions === 0 || coupon.redemptions < coupon.maxRedemptions);
    if (!usable) return fail(res, 400, 'Coupon is not valid');
    discount = coupon!.percentOff > 0 ? (view.subtotal * coupon!.percentOff) / 100 : num(coupon!.amountOff);
    discount = Math.min(discount, view.subtotal);
    couponCode = coupon!.code;
  }

  const shipping = view.subtotal >= 75 ? 0 : 6.99;
  const total = Math.max(0, view.subtotal - discount) + shipping;

  const order = await prisma.$transaction(async (tx) => {
    // Atomic stock check + decrement.
    for (const item of cart.items) {
      const updated = await tx.inventory.updateMany({
        where: { productId: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) throw new Error(`Insufficient stock for ${item.product.name}`);
    }
    const created = await tx.order.create({
      data: {
        number: orderNumber(), userId: req.user!.id, status: 'PAID',
        subtotal: view.subtotal, discount, shipping, total, couponCode,
        shipTo: parsed.data.shipTo,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId, name: i.product.name, unitPrice: num(i.product.price), quantity: i.quantity,
          })),
        },
        payment: {
          create: { method: parsed.data.payment.method, last4: parsed.data.payment.last4, amount: total, status: 'captured' },
        },
      },
    });
    if (couponCode) await tx.coupon.update({ where: { code: couponCode }, data: { redemptions: { increment: 1 } } });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  }).catch((e) => ({ error: String(e.message ?? e) }));

  if ('error' in order) return fail(res, 409, order.error);
  res.status(201).json({ orderId: order.id, number: order.number, total: num(order.total) });
});

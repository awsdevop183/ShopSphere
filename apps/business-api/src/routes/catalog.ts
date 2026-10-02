import { Router } from 'express';
import { prisma } from '../db.js';
import { num } from '../util.js';
import type { Prisma } from '@prisma/client';

export const catalogRouter = Router();

function shape(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: num(p.price),
    compareAt: p.compareAt ? num(p.compareAt) : null,
    rating: p.rating,
    featured: p.featured,
    category: p.category ? { slug: p.category.slug, name: p.category.name } : undefined,
    images: p.images?.map((i: any) => ({ url: i.url, alt: i.alt })) ?? [],
    stock: p.inventory ? p.inventory.stock - p.inventory.reserved : 0,
  };
}

catalogRouter.get('/categories', async (_req, res) => {
  const cats = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json({ categories: cats.map((c) => ({ slug: c.slug, name: c.name, blurb: c.blurb, count: c._count.products })) });
});

// Product listing with safe, parameterised sorting/pagination/filtering.
catalogRouter.get('/products', async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const take = Math.min(48, Math.max(1, Number(req.query.limit ?? 12)));
  const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    newest: { createdAt: 'desc' },
    price_asc: { price: 'asc' },
    price_desc: { price: 'desc' },
    rating: { rating: 'desc' },
    name: { name: 'asc' },
  };
  const orderBy = sortMap[String(req.query.sort ?? 'newest')] ?? sortMap.newest;
  const where: Prisma.ProductWhereInput = {};
  if (req.query.category) where.category = { slug: String(req.query.category) };
  if (req.query.featured === 'true') where.featured = true;
  if (req.query.q) {
    const q = String(req.query.q);
    where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
  }
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where, orderBy, skip: (page - 1) * take, take,
      include: { category: true, images: true, inventory: true },
    }),
  ]);
  res.json({ total, page, limit: take, products: products.map(shape) });
});

catalogRouter.get('/products/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true, images: { orderBy: { position: 'asc' } }, inventory: true,
      reviews: { where: { approved: true }, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({
    product: {
      ...shape(product),
      reviews: product.reviews.map((r) => ({
        id: r.id, rating: r.rating, title: r.title, body: r.body,
        author: `${r.user.firstName} ${r.user.lastName[0]}.`, createdAt: r.createdAt,
      })),
    },
  });
});

catalogRouter.get('/promotions', async (_req, res) => {
  const promos = await prisma.promotion.findMany({ where: { active: true }, orderBy: { startsAt: 'desc' } });
  res.json({ promotions: promos.map((p) => ({ id: p.id, title: p.title, body: p.body })) });
});

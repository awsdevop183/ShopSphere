import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { labRegistry } from '../src/labs/registry.js';
import { ensureLabCatalog } from '../src/labs/fixtures.js';

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hashSync(p, 10);

const CATEGORIES = [
  ['electronics', 'Electronics', 'Gadgets, audio, and smart devices.'],
  ['home-kitchen', 'Home & Kitchen', 'Everyday essentials for every room.'],
  ['fashion', 'Fashion', 'Apparel and accessories for all seasons.'],
  ['outdoor', 'Outdoor & Sports', 'Gear for trails, parks, and play.'],
  ['beauty', 'Beauty & Care', 'Skincare, grooming, and wellness.'],
  ['office', 'Office & Stationery', 'Work smarter, write better.'],
  ['toys', 'Toys & Games', 'Fun for curious minds.'],
  ['books', 'Books & Media', 'Stories, learning, and inspiration.'],
  ['grocery', 'Grocery', 'Pantry staples and treats.'],
  ['pets', 'Pet Supplies', 'Happy companions, well cared for.'],
];

const ADJ = ['Aurora', 'Nimbus', 'Harbor', 'Summit', 'Trail', 'Luna', 'Atlas', 'Cedar', 'Vega', 'Orion', 'Willow', 'Cobalt', 'Ember', 'Frost', 'Pebble', 'Drift', 'Sol', 'Terra', 'Haven', 'Juno'];
const NOUN = ['Desk Lamp', 'Notebook', 'Mug', 'Backpack', 'Bottle', 'Headphones', 'Sneakers', 'Jacket', 'Serum', 'Pen Set', 'Blocks', 'Novel', 'Granola', 'Chew Toy', 'Speaker', 'Chair', 'Blanket', 'Wallet', 'Kettle', 'Charger'];

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

async function main() {
  console.log('Seeding ShopSphere…');
  // Clear (preserve nothing on a fresh seed; db:reset handles migrations).
  await prisma.$transaction([
    prisma.orderItem.deleteMany(), prisma.paymentSimulation.deleteMany(), prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(), prisma.cart.deleteMany(), prisma.review.deleteMany(),
    prisma.wishlistItem.deleteMany(), prisma.supportMessage.deleteMany(), prisma.supportTicket.deleteMany(),
    prisma.productImage.deleteMany(), prisma.inventory.deleteMany(), prisma.product.deleteMany(),
    prisma.category.deleteMany(), prisma.coupon.deleteMany(), prisma.promotion.deleteMany(),
    prisma.studentFinding.deleteMany(), prisma.session.deleteMany(), prisma.address.deleteMany(),
    prisma.customerProfile.deleteMany(), prisma.user.deleteMany(), prisma.labInstance.deleteMany(), prisma.lab.deleteMany(),
    prisma.auditEvent.deleteMany(),
  ]);

  const cats = [];
  for (const [slug, name, blurb] of CATEGORIES) {
    cats.push(await prisma.category.create({ data: { slug, name, blurb } }));
  }

  // 60 products: 6 per category, deterministic names.
  const products = [];
  let n = 0;
  for (const cat of cats) {
    for (let i = 0; i < 6; i++) {
      const name = `${ADJ[n % ADJ.length]} ${NOUN[(n + i) % NOUN.length]}`;
      const slug = slugify(name) + '-' + n;
      const price = Math.round((9 + (n * 7.37) % 640) * 100) / 100;
      const hasSale = n % 3 === 0;
      const p = await prisma.product.create({
        data: {
          slug, name, categoryId: cat.id, price,
          compareAt: hasSale ? Math.round(price * 1.25 * 100) / 100 : null,
          featured: n % 7 === 0,
          rating: Math.round((3.5 + (n % 15) / 10) * 10) / 10,
          description: `The ${name} blends thoughtful design with everyday durability. Part of the ShopSphere ${cat.name} collection, it ships carbon-neutral and is backed by our 30-day promise.`,
          inventory: { create: { stock: 5 + (n * 13) % 120 } },
          images: { create: [
            { url: `https://picsum.photos/seed/${slug}/700/700`, alt: name, position: 0 },
            { url: `https://picsum.photos/seed/${slug}-2/700/700`, alt: `${name} alternate view`, position: 1 },
          ] },
        },
      });
      products.push(p);
      n++;
    }
  }

  // Staff/admin/instructor + 30 customers.
  const admin = await prisma.user.create({ data: { email: 'admin@shopsphere.test', passwordHash: hash('Admin!Pass123'), role: 'ADMIN', firstName: 'Dana', lastName: 'Ops', emailVerified: true } });
  await prisma.user.create({ data: { email: 'staff@shopsphere.test', passwordHash: hash('Staff!Pass123'), role: 'STAFF', firstName: 'Sam', lastName: 'Support', emailVerified: true } });
  await prisma.user.create({ data: { email: 'instructor@shopsphere.test', passwordHash: hash('Teach!Pass123'), role: 'INSTRUCTOR', firstName: 'Robin', lastName: 'Chen', emailVerified: true } });

  const firstNames = ['Avery', 'Blair', 'Casey', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Noor', 'Oakley', 'Parker', 'Quinn', 'Riley', 'Sage', 'Tatum', 'Uma', 'Val', 'Wren', 'Xan', 'Yael', 'Zion', 'Ari', 'Bex', 'Cleo', 'Devi'];
  const customers = [];
  for (let i = 0; i < 30; i++) {
    const fn = firstNames[i];
    const u = await prisma.user.create({
      data: {
        email: `${fn.toLowerCase()}@example.test`, passwordHash: hash('Customer!Pass1'),
        role: 'CUSTOMER', firstName: fn, lastName: 'Doe', emailVerified: true,
        profile: { create: { storeCredit: i % 5 === 0 ? 25 : 0, phone: `555-01${String(i).padStart(2, '0')}` } },
        cart: { create: {} },
        addresses: { create: { label: 'Home', line1: `${100 + i} Market St`, city: 'Springfield', region: 'CA', postal: '90001', country: 'US', isDefault: true } },
      },
    });
    customers.push(u);
  }

  // Legacy plaintext fixture (crypto-failure lab demonstration) — synthetic only.
  await prisma.user.update({ where: { id: customers[0].id }, data: { legacyPassword: 'hunter2-synthetic' } });

  // Orders for the first 12 customers.
  let orderSeq = 0;
  for (const cust of customers.slice(0, 12)) {
    const count = 1 + (orderSeq % 3);
    for (let o = 0; o < count; o++) {
      const picks = [products[(orderSeq * 3) % products.length], products[(orderSeq * 5 + 1) % products.length]];
      const subtotal = picks.reduce((s, p) => s + Number(p.price), 0);
      const shipping = subtotal >= 75 ? 0 : 6.99;
      await prisma.order.create({
        data: {
          number: `SS-2026-${String(10000 + orderSeq)}`, userId: cust.id,
          status: (['PAID', 'SHIPPED', 'DELIVERED'] as const)[orderSeq % 3],
          subtotal, discount: 0, shipping, total: subtotal + shipping, shipTo: `${cust.firstName} Doe, Springfield CA`,
          items: { create: picks.map((p) => ({ productId: p.id, name: p.name, unitPrice: p.price, quantity: 1 })) },
          payment: { create: { method: 'card', last4: '4242', amount: subtotal + shipping, status: 'captured' } },
        },
      });
      orderSeq++;
    }
  }

  // Reviews
  for (let i = 0; i < 40; i++) {
    const p = products[i % products.length];
    const c = customers[(i * 3) % customers.length];
    await prisma.review.create({ data: { productId: p.id, userId: c.id, rating: 3 + (i % 3), title: 'Solid pick', body: 'Works as described and arrived quickly. Would buy again.' } });
  }

  // Coupons in different states
  await prisma.coupon.createMany({ data: [
    { code: 'WELCOME10', description: '10% off your first order', percentOff: 10, state: 'ACTIVE', maxRedemptions: 1000 },
    { code: 'SAVE20', description: '$20 off orders over $100', amountOff: 20, state: 'ACTIVE' },
    { code: 'SUMMER', description: 'Expired summer promo', percentOff: 15, state: 'EXPIRED', expiresAt: new Date('2025-09-01') },
    { code: 'VIP', description: 'Disabled VIP coupon', percentOff: 30, state: 'DISABLED' },
  ] });

  await prisma.promotion.createMany({ data: [
    { title: 'Free shipping over $75', body: 'No code needed — it is automatic at checkout.' },
    { title: 'New arrivals weekly', body: 'Fresh picks every Thursday across all categories.' },
  ] });

  // Support ticket sample
  await prisma.supportTicket.create({ data: { userId: customers[1].id, subject: 'Where is my order?', messages: { create: { author: 'customer', body: 'My package has not arrived yet.' } } } });

  // Register labs in the trusted platform catalog.
  for (const lab of labRegistry) {
    await prisma.lab.create({ data: { id: lab.id, title: lab.title, category: lab.category, difficulty: lab.difficulty, summary: lab.summary } });
  }
  await ensureLabCatalog();

  await prisma.auditEvent.create({ data: { actor: admin.email, action: 'seed', target: 'database', meta: JSON.stringify({ products: products.length, customers: customers.length }) } });

  console.log(`Seeded ${products.length} products, ${customers.length} customers, ${labRegistry.length} labs.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

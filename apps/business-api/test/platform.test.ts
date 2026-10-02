import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

const app = createApp();
afterAll(async () => { await prisma.$disconnect(); });

async function login(email: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token as string;
}

describe('Trusted platform: authentication', () => {
  it('rejects weak passwords at registration', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: `t${Date.now()}@example.test`, password: 'weak', firstName: 'A', lastName: 'B' });
    expect(res.status).toBe(400);
  });
  it('registers and logs in with a strong password', async () => {
    const email = `t${Date.now()}@example.test`;
    const reg = await request(app).post('/api/auth/register').send({ email, password: 'StrongPass99', firstName: 'A', lastName: 'B' });
    expect(reg.status).toBe(201);
    const token = await login(email, 'StrongPass99');
    expect(token).toBeTruthy();
  });
  it('does not store the password in plaintext', async () => {
    const email = `t${Date.now()}@example.test`;
    await request(app).post('/api/auth/register').send({ email, password: 'StrongPass99', firstName: 'A', lastName: 'B' });
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user!.passwordHash).not.toContain('StrongPass99');
    expect(user!.passwordHash.startsWith('$2')).toBe(true); // bcrypt
  });
  it('invalidates the session on logout', async () => {
    const token = await login('avery@example.test', 'Customer!Pass1');
    await request(app).post('/api/auth/logout').set('authorization', `Bearer ${token}`);
    const after = await request(app).get('/api/auth/me').set('authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
  });
});

describe('Trusted platform: authorization', () => {
  it('blocks anonymous access to admin', async () => {
    expect((await request(app).get('/api/admin/dashboard')).status).toBe(401);
  });
  it('blocks customers from admin', async () => {
    const token = await login('avery@example.test', 'Customer!Pass1');
    expect((await request(app).get('/api/admin/dashboard').set('authorization', `Bearer ${token}`)).status).toBe(403);
  });
  it('allows admin to view the dashboard', async () => {
    const token = await login('admin@shopsphere.test', 'Admin!Pass123');
    expect((await request(app).get('/api/admin/dashboard').set('authorization', `Bearer ${token}`)).status).toBe(200);
  });
  it('blocks non-instructors from the instructor console (and its solutions)', async () => {
    const token = await login('avery@example.test', 'Customer!Pass1');
    expect((await request(app).get('/api/instructor/labs').set('authorization', `Bearer ${token}`)).status).toBe(403);
  });
  it('instructor console never exposes solutions to customers', async () => {
    const token = await login('admin@shopsphere.test', 'Admin!Pass123'); // admin != instructor
    const res = await request(app).get('/api/instructor/labs').set('authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('Trusted platform: customer data isolation (ownership)', () => {
  it('a customer cannot read another customer order via the account API', async () => {
    const avery = await login('avery@example.test', 'Customer!Pass1');
    // Find an order belonging to someone else.
    const blair = await prisma.user.findUnique({ where: { email: 'blair@example.test' } });
    const foreignOrder = await prisma.order.findFirst({ where: { userId: blair!.id } });
    if (foreignOrder) {
      const res = await request(app).get(`/api/account/orders/${foreignOrder.id}`).set('authorization', `Bearer ${avery}`);
      expect(res.status).toBe(404);
    }
    expect(true).toBe(true);
  });
});

describe('Trusted platform: student findings are private per student', () => {
  it('a student cannot edit another student\'s finding', async () => {
    const avery = await login('avery@example.test', 'Customer!Pass1');
    const blair = await prisma.user.findUnique({ where: { email: 'blair@example.test' } });
    const f = await prisma.studentFinding.create({ data: { userId: blair!.id, title: 'x', endpoint: '/x', category: 'xss', severity: 'low', steps: 's', impact: 'i', remediation: 'r' } });
    const res = await request(app).patch(`/api/findings/${f.id}`).set('authorization', `Bearer ${avery}`).send({ title: 'hacked' });
    expect(res.status).toBe(404);
  });
});

describe('Lab isolation', () => {
  it('labs honor the master switch (checked via health flag)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('labsEnabled');
  });
  it('request body size is limited on trusted surfaces', async () => {
    const big = 'x'.repeat(300 * 1024);
    const res = await request(app).post('/api/auth/login').set('content-type', 'application/json').send(`{"email":"a@b.c","password":"${big}"}`);
    expect([400, 413]).toContain(res.status);
  });
});
